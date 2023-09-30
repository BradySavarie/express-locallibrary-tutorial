const Genre = require('../models/genre');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

exports.genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find({}).sort({ name: 1 }).exec();
    console.log(allGenres);
    res.render('genre_list', { title: 'Genre List', genre_list: allGenres });
});

exports.genre_detail = asyncHandler(async (req, res, next) => {
    console.log(req.params.id);
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);

    if (genre === null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }

    res.render('genre_detail', {
        title: 'Genre Detail',
        genre: genre,
        genre_books: booksInGenre,
    });
});

exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', { title: 'Create Genre' });
};

exports.genre_create_post = [
    // Validate and sanitize the name field.
    body('name', 'Genre name must contain at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            const genreExists = await Genre.findOne({
                name: req.body.name,
            })
                .collation({ locale: 'en', strength: 2 })
                .exec();
            if (genreExists) {
                // Genre exists, redirect to its detail page.
                res.redirect(genreExists.url);
            } else {
                await genre.save();
                // New genre saved. Redirect to genre detail page.
                res.redirect(genre.url);
            }
        }
    }),
];

exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of genre and all the books (in parallel)
    const [genre, allBooksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: { $in: [req.params.id] } }, 'title summary').exec(),
    ]);

    if (genre === null) {
        // No results.
        res.redirect('/catalog/genres');
    }

    res.render('genre_delete', {
        title: 'Delete Genre',
        genre: genre,
        genre_books: allBooksInGenre,
    });
});

exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [genre, allBooksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: { $in: [req.params.id] } }, 'title summary').exec(),
    ]);

    if (allBooksInGenre.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render('genre_delete', {
            title: 'Delete Genre',
            genre: genre,
            genre_books: allBooksInGenre,
        });
        return;
    } else {
        // Author has no books. Delete object and redirect to the list of authors.
        await Genre.findByIdAndRemove(req.body.genreid);
        res.redirect('/catalog/genres');
    }
});

exports.genre_update_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre update GET');
});

exports.genre_update_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre update POST');
});
