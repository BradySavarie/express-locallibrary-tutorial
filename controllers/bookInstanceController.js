const BookInstance = require('../models/bookInstance');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate('book').exec();
    console.log(allBookInstances);

    res.render('bookInstance_list', {
        title: 'Book Instance List',
        bookinstance_list: allBookInstances,
    });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate('book')
        .exec();

    if (bookInstance === null) {
        // No results.
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
    }

    res.render('bookInstance_detail', {
        title: 'Book:',
        bookinstance: bookInstance,
    });
});

exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title').exec();

    res.render('bookInstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
    });
});

exports.bookinstance_create_post = [
    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors.
            // Render form again with sanitized values and error messages.
            const allBooks = await Book.find({}, 'title').exec();

            res.render('bookInstance_form', {
                title: 'Create Book Instance',
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,
            });
            return;
        } else {
            // Data from form is valid
            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    }),
];

exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findOne({ _id: req.params.id })
        .populate({
            path: 'book',
            populate: {
                path: 'author',
                model: 'Author',
            },
        })
        .exec();

    if (bookInstance === null) {
        res.redirect('/catalog/bookInstances');
    }

    res.render('bookInstance_delete', {
        title: 'Delete Book Instance',
        bookinstance: bookInstance,
    });
});

exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    await BookInstance.findByIdAndRemove(req.params.id).exec();
    res.redirect('/catalog/bookInstances');
});

exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    // Get book, authors and genres for form.
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate('book')
        .exec();
    const allBooks = await Book.find({}, 'title').exec();

    if (bookInstance === null) {
        // No results.
        const err = new Error('Book instance not found');
        err.status = 404;
        return next(err);
    }

    res.render('bookInstance_form', {
        title: 'Update Book Instance',
        selected_book: bookInstance.book._id,
        bookinstance: bookInstance,
        book_list: allBooks,
    });
});

exports.bookinstance_update_post = [
    // Validate and sanitize fields.
    body('imprint', 'Imprint must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        const allBooks = await Book.find({}, 'title').exec();
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id, // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            res.render('bookInstance_form', {
                title: 'Update Book Instance',
                bookinstance: bookInstance,
                selected_book: bookInstance.book._id,
                book_list: allBooks,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            const updatedBook = await BookInstance.findByIdAndUpdate(
                req.params.id,
                bookInstance,
                {}
            ).exec();
            // Redirect to book detail page.
            res.redirect(updatedBook.url);
        }
    }),
];
