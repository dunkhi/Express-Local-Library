const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");
const async = require("async");
const asyncHandler = require("express-async-handler");

exports.index = (req, res) => {
   async.parallel(
      {
         book_count(callback) {
            console.log('in book count');
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
         },
         book_instance_count(callback) {
            BookInstance.countDocuments({}, callback);
         },
         book_instance_available_count(callback) {
            BookInstance.countDocuments({ status: "Available" }, callback);
         },
         author_count(callback) {
            Author.countDocuments({}, callback);
         },
         genre_count(callback) {
            Genre.countDocuments({}, callback);
         },
      },
      (err, results) => {
         res.render("index", {
            title: "Local Library Home",
            error: err,
            data: results,
         });
      }
   );
};

// Display list of all books.
exports.book_list = function(req, res, next) {
   Book.find({}, "title author")
      .sort({ title: 1})
      .populate("author")
      .exec(function (err, list_books){
         if (err) {
            return next(err)
         }
         res.render("book_list", { title: "Book List", book_list: list_books})
      })
}

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
   async.parallel(
      {
         book(callback) {
            Book.findById(req.params.id)
                  .populate("author")
                  .populate("genre")
                  .exec(callback)
         },
         book_instance(callback) {
            BookInstance.find( { book: req.params.id } )
                        .exec(callback);
         },
      },
      (err, results) => {
         if (err) {
            return next(err);
         }
         if (results.book == null) {
            const err = new Error("Book not found");
            err.status = 404;
            return next(err);
         }
         console.log('Book Detail Success');
         res.render("book_detail", {
            title: results.book.title,
            book: results.book,
            book_instances: results.book_instance,
            author: results.book.author,
         });
      }
   );
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
   async.parallel(
      {
         authors(callback) {
            Author.find(callback);
         },
         genres(callback) {
            Genre.find(callback);
         },
      },
      (err, results) => {
         if(err) {
            return next(err);
         }
         res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
         });
      }
   );
};

// Handle book create on POST.
exports.book_create_post = [

   (req, res, next) => {
      if(!Array.isArray(req.body.genre)) {
         req.body.genre =
            typeof req.body.genre === "undefined" ? [] : [req.body.genre];
      }
      next();
   },

   body("title", "Title must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
   body("author", "Author must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
   body("summary", "Summary must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
   body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
   body("genre.*").escape(),

   (req, res, next) => {
      const errors = validationResult(req);

      const book = new Book({
         title: req.body.title,
         author: req.body.author,
         summary: req.body.summary,
         isbn: req.body.isbn,
         genre: req.body.genre
      });

      if(!errors.isEmpty()) {
         async.parallel(
            {
               authors(callback) {
                  Author.find(callback);
               },
               genres(callback) {
                  Genre.find(callback);
               },
            },
            (err, results) => {
               if (err) {
                  next(err);
               }

               for (const genre of results.genres) {
                  if (book.genre.includes(genre._id)) {
                     genre.checked = "true";
                  }
               }

               res.render("book_form", {
                  title: "Create Book",
                  authors: results.authors,
                  genres: results.genres,
                  book,
                  errors: errors.array()
               });
            }
         );
         return; 
      }

      book.save((err) => {
         if (err) {
            return next(err);
         }

         res.redirect(book.url);
      });
   }
]

// Display book delete form on GET.
// can't delete until book instances are deleted
exports.book_delete_get = (req, res, next) => {
   async.parallel({
         book(callback) {
            Book.findById(req.params.id).exec(callback);
         },
         book_instances(callback) {
            BookInstance.find({ book: req.params.id }).exec(callback);
         },
      },
      (err, results) => {
         if (err) {
            return next(err);
         }
         if (results.book == null) {
            res.redirect("/catalog/books");
         }
         console.log('book delete get success:');
         res.render("book_delete", {
            title: "Delete this Book?",
            book: results.book,
            book_instances: results.book_instances,
         })
      }
   )
};

// Handle book delete on POST.
exports.book_delete_post = (req, res, next) => {
   async.parallel({
      book(callback) {
         Book.findById(req.params.id).exec(callback);
      },
      book_instances(callback) {
         BookInstance.find({ book: req.params.id }).exec(callback);
      },
   },
   (err, results) => {
      if (err) {
         return next(err);
      }
      if (results.book_instances.length > 0) {
         res.render("book_delete", {
            title: "Delete this Book?",
            book: results.book,
            book_instances: results.book_instances,
         })
      }
      Book.findByIdAndRemove(req.params.id, (err) => {
         if (err) {
            return next(err);
         }
       res.redirect("/catalog/authors")
         
      })
   })
};

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
      const [book, allAuthors, allGenres] = await Promise.all([
            Book.findById(req.params.id).populate("author").populate("genre").exec(),
            Author.find().exec(),
            Genre.find().exec()
      ]);

      if (book == null) {
         const error = new Error("Book not found");
         error.status = 404;
         return next(error);
      }

      for (const genre of allGenres) {
         for (const bookGenre of book.genre) {
            if (bookGenre._id.toString() == genre._id.toString()) {
                genre.checked = "true";
            }
         }
      }

      res.render("book_form", {
          title: "Update Book",
          authors: allAuthors,
          book: book,
          genres: allGenres
      })
})

// Handle book update on POST.
exports.book_update_post = [
      (req, res, next) => {
      if (!(req.body.genre instanceof Array)) {
        if (typeof req.body.genre === "undefined") {
          req.body.genre = [];
        } else {
          req.body.genre = new Array(req.body.genre);
        }
      }
      next();
    },

      body("title", "Title must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
      body("author", "Author must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
      body("summary", "Summary must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
      body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
      body("genre.*").escape(),
    
      asyncHandler(async (req, res, next) => {
         const errors = validationResult(req);

         const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
            _id: req.params.id,
         });
         if (!errors.isEmpty()) {

            const [allAuthors, allGenres] = await Promise.all([
               Author.find().exec(),
               Genre.find().exec(),
            ]);

            for(const genre of allGenres) {
               if (book.genre.indexOf(genres._id) > -1) {
                  genre.checked = "true";
               }
            }

            res.render("book_form", {
               title: "Update Book",
               authors: allAuthors,
               genres: allGenres,
               book: book,
               errors: errors.array(),
            });
            return;
         } else {
            
            const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
            console.log(`Update Book Post, updatedbook: ${updatedBook}`);
            res.redirect(updatedBook.url);
         }
      })
]