const Author = require("../models/author");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");
const bodyParser = require("body-parser");
const asyncHandler = require("express-async-handler");

exports.author_list = function(req, res, next) {
   Author.find()
         .sort([["family_name", "ascending"]])
         .exec(function (err, list_authors) {
            if(err) {
               return next(err);
            }
            res.render("author_list", {
               title: "Author List",
               author_list: list_authors,
            });
         });
};

exports.author_detail = (req, res, next) => {
   async.parallel(
      {
         author(callback) {
            Author.findById(req.params.id).exec(callback);
         },
         authors_books(callback) {
            Book.find({ author: req.params.id}, "title summary").exec(callback);
         },
         test: function(callback) {
            Author.find({}).exec(callback);
         }
      },
      (err, results) => {
         if (err) {  
            return next(err);
         }
         if (results.author == null) {
            debugger;
            const err = new Error("Author not found!! 3:");
            err.status = 404;
            return next(err);
         }
         // console.log('author_detail: ' + JSON.stringify(results));
         res.render("author_detail", {
            title: "Author Detail",
            author: results.author,
            author_books: results.authors_books,
            all_authors: results.test,
         })
      }
   )
}

exports.author_create_get = (req, res, next) => {
   res.render("author_form", { title: "Create Author"});
}

exports.author_create_post = [
   body("first_name")
      .trim()
      .isLength({ min: 1})
      .escape()
      .withMessage("First name is required.")
      .isAlphanumeric()
      .withMessage("First name has non alphanumeric characters."),
   body("family_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Family name is required.")
      .isAlphanumeric()
      .withMessage("Family name has non alphanumeric characters."),
   body("date_of_death", "Invalid date of death")
      .optional({checkFalsy: true})
      .isISO8601()
      .toDate(),

   (req, res, next) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
         res.render("author_form", {
            title: "Create Author",
            author: req.body,
            errors: errors.array()
         })
      }
      const author = new Author({
         first_name: req.body.first_name,
         family_name: req.body.family_name,
         date_of_birth: req.body.date_of_birth,
         date_of_death: req.body.date_of_death
      });

      author.save((err) => {
         if (err) {
            return next(err);
         }
         res.redirect(author.url);
      })
   }
]

exports.author_delete_get = (req, res, next) => {
   async.parallel(
      {
         author(callback) {
            Author.findById(req.params.id).exec(callback);
         },
         author_books(callback) {
            Book.find({ author: req.params.id}).exec(callback);
         },
      },
      (err, results) => {
         if (err) {
            return next(err);
         }
         if (results.author == null) {
            res.redirect("/catalog/authors");
         }
         console.log('delete get success: ' + JSON.stringify(results) + '\n');
         res.render("author_delete", {
            title: "Delete Author",
            author: results.author,
            author_books: results.author_books,
         });
      }
   );
}

exports.author_delete_post = (req, res, next) => {
   async.parallel(
      {
         author(callback) {
            Author.findById(req.params.id).exec(callback);
         },
         author_books(callback) {
            Book.find({ author: req.params.id }).exec(callback);
         }
      },
      (err, results) =>
      {
         if (err) {
            return next(err);
         }
         if (results.author_books.length > 0) {
            res.render("author_delete", {
               title: "Can't Delete Author",
               author: results.author,
               author_books: results.author_books,
            });
            return;
         }
         console.log('delete post success: \n' + JSON.stringify(req.body));
         Author.findByIdAndRemove(req.body.authorid, (err) => {
            if (err) {
               return next(err);
            }
            res.redirect("/catalog/authors");
         });
      }
   )
}

exports.author_update_get = asyncHandler(async (req, res, next) => {
   const [author, allBooks] = await Promise.all([
      Author.findById(req.params.id).exec(),
      Book.find({ author: req.params.id}).exec()
   ]);

   if (author == null) {
      const error = new Error("Author not found");
      error.status = 404;
      return next(error);
   }
   console.log('Author Update: ' + author);
   res.render("author_form", {
      title: "Update author",
      author: author,
      books: allBooks
   })
})

exports.author_update_post = [
   body("first_name")
      .trim()
      .isLength({ min: 2})
      .escape()
      .withMessage("First needs to be more than two characters.")
      .isAlphanumeric()
      .withMessage("First name has non alphanumeric characters."),
   body("family_name")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Family name is required.")
      .isAlphanumeric()
      .withMessage("Family name has non alphanumeric characters."),
   body("date_of_birth", "Invalid date of birth")
      .optional({checkFalsy: true})
      .isISO8601()
      .toDate(),
   body("date_of_death", "Invalid date of death")
      .optional({checkFalsy: true})
      .isISO8601()
      .toDate(),

      (req, res, next) => {
         const errors = validationResult(req);

         const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
         });

         if(!errors.isEmpty()) {
            console.log('Validation Errors: ' + JSON.stringify(errors.array()));
            res.render("author_form", {
               title: "Create Author",
               author: req.body,
               errors: errors.array()
            })
         } else {
            const updatedAuthor = Author.findByIdAndUpdate(req.body._id, author, {});
            res.redirect(updatedAuthor.url);
         }
      }
]