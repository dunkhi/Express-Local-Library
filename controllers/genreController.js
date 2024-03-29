const { body, validationResult } = require("express-validator");
const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const asyncHandler = require("express-async-handler");

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
   Genre.find()
         .sort([["name", "asc"]])
         .exec(function (err, genre_list) {
            if (err) {
               return next(err);
            }
            res.render("genre_list", {
               title: "Genre List",
               genre_list: genre_list
            });
         });
};

exports.genre_test = function (req, res, next) {
   Genre.find({})
         .lean()
         .exec(function(error, records) {
            records.forEach(function(record) {
               console.log(record.name + ', ' + record._id);
            })
         });
}

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
   async.parallel(
      {
         // call back is a function(err, result)
         // if the method returns a result it will pass back genre: genre object
         genre(callback) {
            Genre.findById(req.params.id).exec(callback);
         },
         genre_books(callback) {
            Book.find({ genre: req.params.id }).exec(callback);
         },
      },
      (err, results) => {
         if (err) {
            return next(err);
         }
         if (results.genre == null) {
            const err = new Error("Genre not found");
            err.status = 404;
            return next(err);
         }
         res.render("genre_detail", {
            title: "Genre Detail",
            genre: results.genre,
            genre_books: results.genre_books
         }) 
      }
   )
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
   res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
   body("name", "Genre name is required").trim().isLength({ min: 1}).escape(),

   (req, res, next) => {
      const errors = validationResult(req);

      const genre = new Genre({ name: req.body.name });

      if (!errors.isEmpty()) {
         res.render("genre_form", {
            title: "Create Genre",
            genre,
            errors: errors.array(),
         });
         return;
      } else {
         Genre.findOne({ name: req.body.name }).exec((err, found_genre) =>{
            if (err) {
               return next(err);
            }

            if (found_genre) {
            res.redirect(found_genre.url);
            console.log('genre already exists')
            } else {
               genre.save((err) => {
                  if (err) {
                     return next(err);
                  }
                  res.redirect(genre.url);
               });
            }
         });
      }
   },
];

// Add delete button to genre detail form
// get related books
// if books count > 0 tell user to delete them first
// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
   async.parallel({
         genre(callback) {
            Genre.findById(req.params.id).exec(callback);
         },
         books(callback) {
            Book.find({ genre: req.params.id }).exec(callback);
         },
      },
      (err, results) => {
         if (err) {
            return next(err);
         }
         if (results.genre == null) {
            const err = new Error("Genre not found");
            err.status = 404;
            return next(err);
         }
         res.render("genre_delete", {
            title: "Genre Delete",
            genre: results.genre,
            genre_books: results.books
         }) 
      }   
   )
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
   async.parallel({
         genre(callback) {
            Genre.findById(req.params.id).exec(callback);
         },
         books(callback) {
            Book.find({ genre: req.params.id }).exec(callback);
         },
      },
      (err, results) => {
         if (err) {
            return next(err);
         }
         if (results.books.length > 0) {
            res.render("genre_delete", {
               title: "Delete this Genre?",
               genre: results.genre,
               books: results.books
            })
         }
         Genre.findByIdAndRemove(req.params.id, (err) => {
            if (err) {
               return next(err);
            }
            res.redirect("/catalog/genres");
         })
      }   
   )
};

// validate request
// populate create form with requeset name
// Display Genre update form on GET.
exports.genre_update_get = (async(req, res, next) => {
      await Genre.findById(req.params.id)
                  .exec((err, genre) => {
                     if (genre == null) {
                        const error = new Error("Genre Instance not found!");
                           error.status = 404;
                           return next(error);
                     }
                     console.log(`Genre Update Get: \n ${genre}`);
                     res.render("genre_form", {
                        title: "Update Genre",
                        genre: genre
                     })
                  });
})

// Handle Genre update on POST.
exports.genre_update_post = [
   body("name", "Genre name is required").trim().isLength({ min: 1}).escape(),

   // check if genre with name already exists
   asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);

      const genre = new Genre({
         name: req.body.name,
         _id: req.params.id,
      });

      console.log(`Update Genre Post: ${genre}`);
      if(!errors.isEmpty()) {
         res.render("genre_form", {
            title: "Genre Update",
            genre,
            errors: errors.array()
         });
         return;
      } else {
         Genre.findOne({ name: req.body.name }).exec(async (err, found_genre) =>{
            if (err) {
               return next(err);
            }

            if (found_genre) {
            res.redirect(found_genre.url);
            console.log('genre already exists')
            } else {
               
               const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
               console.log(`Update Genre Post, updatedGenre: ${updatedGenre}`);
               res.redirect(genre.url);
            }
         });
      }
   })
]
