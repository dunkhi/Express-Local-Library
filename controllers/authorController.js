const Author = require("../models/author");
const Book = require("../models/book");
const async = require("async")
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
         res.render("author_detail", {
            title: "Author Detail",
            author: results.author,
            author_books: results.authors_books,
         })
      }
   )
}

exports.author_create_get = (req, res) => {
   res.send('NOT IMPLEMENTED: Author create GET');
}

exports.author_create_post = (req, res) => {
   res.send('NOT IMPLEMENTED: Author create POST');
}

exports.author_delete_get = (req, res) => {
   res.send('NOT IMPLEMENTED: Author delete GET');
}

exports.author_delete_post = (req, res) => {
   res.send('NOT IMPLEMENTED: Author delete POST');
}

exports.author_update_get = (req, res) => {
   res.send('NOT IMPLEMENTED: Author update GET');
}

exports.author_update_post = (req, res) => {
   res.send('NOT IMPLEMENTED: Author update POST');
}