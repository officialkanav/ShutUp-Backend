const mongoose = require("mongoose");
try {
  mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
} catch (e) {
  console.log(e);
}
