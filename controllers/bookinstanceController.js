const BookInstance = require("../models/bookinstance"); 
const { body, validationResult } = require("express-validator");
var Book = require("../models/book");
const async = require("async");
const asyncHandler = require("express-async-handler");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
   BookInstance.find()
   .populate("book")
   .exec(function (err, list_bookinstances) {
      if (err) {
      return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_list", {
      title: "Book Instance List",
      bookinstance_list: list_bookinstances,
      });
   });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
   BookInstance.findById(req.params.id)
               .populate({
                  path: "book",
                  populate: {
                     path: "author"
                  }
               })
               .exec((err, bookinstance) => {
                  if (err) {
                     return next(err);
                  }
                  if (bookinstance == null) {
                     const err = new Error("Book copy not found");
                     err.status = 404;
                     return next(err);
                  }
                  res.render("bookinstance_detail", {
                     title: `Copy: ${bookinstance.book.title}`,
                     bookinstance,
                  });
               });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
   Book.find({}, "title").exec((err, books) => {
      if (err) {
         return next(err);
      }
      res.render("bookinstance_form", {
         title: "Create BookInstance",
         book_list: books,
      }); 
   })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

   body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
   body("imprint", "Imprint must be specified")
      .trim()
      .isLength({ min: 1 })
      .escape(),
   body("status").escape(),
   body("due_back", "Invalid Date")
      .optional({ checkFalsy: true })
      .isISO8601()
      .toDate(),

   (req, res, next) => {
      const errors = validationResult(req);
      debugger;
      console.log('in create post');
      const bookinstance = new BookInstance({
         book: req.body.book,
         imprint: req.body.imprint,
         status: req.body.status,
         due_back: req.body.due_back,
      });
      console.log(`bookinstance: ${bookinstance.status}`);
      if(!errors.isEmpty()) {
         Book.find({}, "title").exec(function (err, books) {
            if (err) {
               return next(err);
            }

            res.render("bookinstance_form", {
               title: "Create BookInstance",
               book_list: books,
               selected_book: bookinstance.book._id,
               selected_status: bookinstance.status,
               errors: errors.array(),
               bookinstance
            });
         });
         return;
      }
      bookinstance.save((err) => {
         if (err) {
            return  next(err);
         }

         res.redirect(bookinstance.url);
      })
   }
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
   BookInstance.findById(req.params.id)
               .populate({
                  path: "book",
                  populate: {
                     path: "author"
                  }
               })
               .exec(function (err, bookinstance) {
                  if (err) {
                     return next(err);
                  }
                  console.log('book instance populate: ' + bookinstance);
                  res.render("bookinstance_delete" , {
                     title: "Book Instance Delete",
                     id: bookinstance._id,
                     imprint: bookinstance.imprint,
                     book: bookinstance.book
                  })
               })
   
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
   console.log('bookinstance delete post: ' + JSON.stringify(req.body));
   BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
      if (err) {
         return next(err);
      }
      res.redirect("/catalog/bookinstances");
   })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (async (req, res, next) => {
   await BookInstance.findById(req.params.id)
                     .populate("book")
                     .exec((err, bookinstance) => {
                        if (bookinstance == null) {
                           const error = new Error("Book Instance not found!");
                           error.status = 404;
                           return next(error);
                        }
                        Book.find({}, "title").exec(function (err, books){
                           if (err) {
                              return next(err);
                           }
                           res.render("bookinstance_form", {
                              title: "Create BookInstance",
                              book_list: books,
                              selected_book: bookinstance.book._id,
                              selected_status: bookinstance.status,
                              bookinstance
                           });
                        })
                     });
})


// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
   body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
   body("imprint", "Imprint must be specified")
      .trim()
      .isLength({ min: 1 })
      .escape(),
   body("status").escape(),
   body("due_back", "Invalid Date")
      .optional({ checkFalsy: true })
      .isISO8601()
      .toDate(),

      asyncHandler(async (req, res, next) => {
         const errors = validationResult(req);
         debugger;
         console.log('in update post\n');
         console.log(`Request params: ${JSON.stringify(req.params)}`)
         const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
         });
         console.log(`BookInstance: ${bookinstance}`);
         if(!errors.isEmpty()) {
            Book.find({}, "title").exec(function (err, books) {
               if (err) {
                  return next(err);
               }
               
               res.render("bookinstance_form", {
                  title: "Create BookInstance",
                  book_list: books,
                  selected_book: bookinstance.book._id,
                  selected_status: bookinstance.status,
                  errors: errors.array(),
                  bookinstance
               });
            });
            return;
         } else {
            const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});

            res.redirect(updatedBookInstance.url);
         }
      })
]
