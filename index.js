const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config");
const nodemailer = require("nodemailer");

const app = express();
const multer = require("multer");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

app.use("/images", express.static("resources/images"));

const Treatment = require("./treatments");
const Blog = require("./blogs");
const User = require("./user");
const Faq = require("./faqs");
const ClinicDetails = require("./clinicDetails");

const fs = require("fs");
const path = require("path");
const { title } = require("process");

// Treatments list API
app.get("/list", async (req, res) => {
  const data = await Treatment.find();
  console.log(data);
  res.send(data);
});

// Delete Treatment API
app.delete("/delete-treatment/:_id", async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedTreatment = await Treatment.findByIdAndDelete(_id);
    if (!deletedTreatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }
    res.json({ message: "Treatment deleted successfully" });
  } catch (error) {
    console.error("Error deleting treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Multer setup for handling FormData
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "resources", "images")); // Set the destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename for uploaded images
  },
});
const upload = multer({ storage });

// Update Treatment route using multer for parsing FormData
app.put(
  "/treatment-update/:_id",
  upload.single("image_url"),
  async (req, res) => {
    const { _id } = req.params;
    const { treatment_name, short_desc, long_desc } = req.body;

    try {
      // Handle image upload
      const imageUrl = `${process.env.BASE_URL}/images/${req.file.filename}`;

      // Update treatment details in the database using async/await
      const updatedTreatment = await Treatment.findByIdAndUpdate(
        _id,
        { treatment_name, long_desc, short_desc, image_url: imageUrl },
        { new: true },
      );

      if (!updatedTreatment) {
        console.error("Error updating treatment: Treatment not found");
        return res.status(404).json({ error: "Treatment not found" });
      }

      res.json({
        message: "Treatment updated successfully",
        treatment: updatedTreatment,
      });
    } catch (error) {
      console.error("Error updating treatment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Add Treatment route using multer for parsing FormData
app.post("/add-treatment", upload.single("image_url"), async (req, res) => {
  const { treatment_name, short_desc, long_desc } = req.body;

  try {
    // Handle image upload
      const imageUrl = `${process.env.BASE_URL}/images/${req.file.filename}`;

    // Create new treatment in the database using async/await
    const newTreatment = new Treatment({
      treatment_name,
      short_desc,
      long_desc,
      image_url: imageUrl,
    });
    const savedTreatment = await newTreatment.save();

    res.json({
      message: "Treatment added successfully",
      treatment: savedTreatment,
    });
  } catch (error) {
    console.error("Error adding treatment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add some Treatments
async function addTreatments(treatments) {
  try {
    const treatmentsWithImages = treatments.map((treatment) => {
      const imagePath = `/${treatment.image_path}`;
      const imageUrl = `${process.env.BASE_URL}${imagePath}`;

      return {
        treatment_name: treatment.treatment_name,
        short_desc: treatment.short_desc,
        long_desc: treatment.long_desc,
        image_url: imageUrl,
      };
    });

    // Insert treatments into the database
    const insertedTreatments = await Treatment.insertMany(treatmentsWithImages);
    console.log("Treatments added to the database:", insertedTreatments);
    return insertedTreatments;
  } catch (error) {
    console.error("Error adding treatments to the database:", error);
    throw error;
  }
}

// Treatments to add
const treatmentsToAdd = [
  {
    treatment_name: "Dental Fillings",
    short_desc: "Repairing the decay with fillings that blend in.",
    long_desc:
      "A dental restoration, also known as a dental filling, is a procedure that restores the function, shape, and structure of a decayed tooth structure which could be a result of caries or trauma. Tooth-colored restorations also called composite restoration binds chemically to the tooth surface thus replicating the normal tooth color, form, and function. These fillings have a strength similar to a healthy tooth with no cavities. There are a variety of dental filling materials available out of which Gold, silver, amalgam are discontinued due to various reasons. The tooth-colored restorations such as composites, and glass ionomers filling material are widely used options for filling teeth nowadays. Do remember that we can help you determine the best type of filling material as per the location and extent of the decay and your oral hygiene conditions. CONTACT US TO KNOW MORE !!!",
    image_path: "images/dentalfillings.svg",
  },
  {
    treatment_name: "Orthodontic Treatment/Braces",
    short_desc: "Never be too shy to smile.",
    long_desc:
      "Dental negligence during teenage years often leads to the presence of misaligned teeth which is not pleasing once an individual begins his adult college or professional life. These misaligned patterns of teeth often include crowding, crooked teeth, and spacing between teeth along with functional discrepancies which could be a reason to not smile often and might lead to anxiety or self-confidence issues. The position of teeth may have an impact on the shape of the face and its appearance therefore getting it corrected can help boost your confidence and aid in normal function as well. Orthodontic treatment helps in aligning the teeth in a proper position which not only has cosmetic aspects but also helps in improving the function of teeth. This treatment is practiced by a specialist called an orthodontist. Malaligned teeth can be a result of many habits acquired during childhood like nail/lip biting, tongue thrusting, or other factors like finger sucking, small jaw size, or trauma. Some people may benefit from newer mini-braces, which are much smaller than traditional braces as the latter poses a means of unpleasant appearance. Removable plastic retainers are another option for teeth straightening. If your teeth aren't too crowded, this may also work. We will guide you about the different types of braces and help you decide which one is best for you. BOOK YOUR APPOINTMENT NOW!!!",
    image_path: "images/orthodontic.svg",
  },
  {
    treatment_name: "Root Canal Treatment",
    short_desc: "Let's save the tooth.",
    long_desc:
      "The most common reason for an individual to visit a dental surgeon is pain. Pain can be caused by various reasons of which dental caries is the most common reason. Usually, caries that are not too deep but cause sensitivity is dealt with by dental fillings. But what if it has gone too deep to be sealed by just filling?? We have a solution for this. Root canal treatment helps eliminate bacteria from the infected root canal and prevents reinfection of the tooth and helps save the natural tooth. The procedure requires the removal of the decayed and infected part followed by cleaning and filling of the canal with proper medications and finally sealing it off followed by crown placement. We provide treatment options that help improve your smile and tooth function. CONTACT US FOR MORE DETAILS.",
    image_path: "images/rootCanal.svg",
  },
  {
    treatment_name: "Teeth Whitening",
    short_desc: "Are you eyeing whiter Teeth?",
    long_desc:
      "Teeth whitening is a simple procedure. Tooth-whitening bleaches help break down stains, resulting in brighter teeth. There are two types of stains - extrinsic and intrinsic. Extrinsic stains as a result of coffee drinking, smoking, or certain other foodstuffs respond better to teeth whitening as compared to intrinsic stains as a result of fluoride, tetracycline, or even pulpal damage which might require extended sitting to achieve desired results. In-office option: Application of a gel and the use of light to speed up and enhance the bleaching process. Tooth sensitivity and gingival inflammation can be potential side effects of tooth whitening. Always note to choose your shade wisely and lot go after traditional pearl white tooth so as to offer a naturally healthy and beautiful smile. Your doctor will always be happy to guide you through your shade selection process. BOOK YOUR APPOINTMENT TO GET THE BEST TREATMENT !!!",
    image_path: "images/teethWhitening.svg",
  },
  {
    treatment_name: "Dental Implants",
    short_desc: "Make your implants last a lifetime.",
    long_desc:
      "For replacing a missing tooth or teeth, dental implants are so far the most popular and ideal option. They have had a significant impact on dentistry in the last quarter-century or so. Dental implants can be used to replace a single missing tooth as an implant-supported bridge and a full mouth implant-supported overdenture. Implant-supported crowns and dentures have the advantage of not shifting or slipping while eating or speaking. They are more natural and comfortable, and they also prevent natural bone loss. The quality and quantity of bone available determine their success. Also, the final restoration that is placed on top of the implant has a significant impact. REACH OUT TO US FOR FURTHER QUERIES !!!",
    image_path: "images/dentalImplants.svg",
  },
  {
    treatment_name: "Pediatric Dentistry",
    short_desc: "For your child's dental health",
    long_desc:
      "Healthy habits last a lifetime and without proper dental care and knowledge, children are at risk of developing tooth decay, which can lead to a lifetime of pain and fear. Therefore imparting the knowledge early can keep the complications at bay. Pediatric Dentistry lays its emphasis on : Educating and counseling the parents so that oral health care and examinations can begin from an early age and reduce the risk of developing dental decay. Important preventive measures such as proper nutrition and diet recommendation along with fluoride and sealant treatments can help safeguard a child's teeth. A continuous evaluation can help assess and evaluate the dental health as the child grows so that major dental issues and problems can be treated early such as counseling for habits such as thumb sucking, and finger chewing which can result in the alignment of the teeth. CONTACT US TO KNOW MORE !!!",
    image_path: "images/padeatric.svg",
  },
  {
    treatment_name: "Dentures",
    short_desc: "Know the right type of denture for you.",
    long_desc:
      "Dentures are a popular tooth replacement option that is also one of the oldest treatment methods. Dentures aid in food chewing, speech, and a person's aesthetic appeal. Depending on the number of teeth that need to be replaced, removable partial or complete dentures can be made. Partial Dentures: When one or more natural teeth remain in the upper or lower jaw. Complete Dentures: When all of the teeth in a jaw have been lost and need to be replaced prosthetically Do not make the decision on your own: the type of dentures you require is primarily dependent on the condition of your present teeth, jaws, gum health, and overall oral hygiene and maintenance. CONTACT US TO LEARN MORE.",
    image_path: "images/dentures.svg",
  },
  {
    treatment_name: "Cosmetic Dentistry",
    short_desc: "Time to flaunt that smile.",
    long_desc:
      "Cosmetic dentistry is the new frontier when it comes to enhancing one's smile and enhancing one's appearance. Teeth color, shape, size, alignment, and occlusion are all improved. The following treatments are included in cosmetic dental procedures: Crooked teeth. Malaligned teeth. Gap between teeth. Protruding teeth. Stained teeth. Gummy smiles. Fractured teeth. Pigmentation on gums. Old silver fillings. Cosmetic treatments like cosmetic fillings, porcelain veneers, teeth whitening, crown and bridge, full mouth rehabilitation, smile correction, and teeth restoration are provided at our clinic. CONTACT US TO GET THE BEST SERVICE !!!",
    image_path: "images/cosmeticDentistry.svg",
  },
];

// Call the function to add treatments to the database
addTreatments(treatmentsToAdd)
  .then(() => console.log("Treatments added successfully"))
  .catch((err) => console.error("Failed to add treatments:", err));

//===========================================================================================
//===========================================================================================

// blogs list API
app.get("/blog-list", async (req, res) => {
  const data = await Blog.find();
  console.log(data);
  res.send(data);
});

// Add Blog route using multer for parsing FormData
app.post("/add-blog", upload.single("image_url"), async (req, res) => {
  const { title, short_desc, long_desc, date } = req.body;

  try {
    // Handle image upload
    const imageUrl = `${process.env.BASE_URL}/images/${req.file.filename}`;

    // Create new blog in the database using async/await
    const newBlog = new Blog({
      title,
      short_desc,
      long_desc,
      image_url: imageUrl,
      date,
    });
    const savedBlog = await newBlog.save();

    res.json({
      message: "Blog added successfully",
      blog: savedBlog,
    });
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Blog route using multer for parsing FormData
app.put("/blog-update/:_id", upload.single("image_url"), async (req, res) => {
  const { _id } = req.params;
  const { title, short_desc, long_desc, date } = req.body;

  try {
    const updateFields = { title, short_desc, long_desc, date };

    if (req.file) {
      updateFields.image_url = `${process.env.BASE_URL}/images/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      _id,
      updateFields,
      { new: true },
    );

    if (!updatedBlog) {
      console.error("Error updating blog: Blog not found");
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Treatment API
app.delete("/delete-blog/:_id", async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedBlog = await Blog.findByIdAndDelete(_id);
    if (!deletedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add some Blogs
async function addBlogs(blogs) {
  try {
    const blogsWithImages = blogs.map((blog) => {
      const imagePath = `/${blog.image_path}`;
      const imageUrl = `${process.env.BASE_URL}${imagePath}`;

      return {
        title: blog.title,
        short_desc: blog.short_desc,
        long_desc: blog.long_desc,
        image_url: imageUrl,
        date: blog.date,
      };
    });

    // Insert blogs into the database
    const insertedBlogs = await Blog.insertMany(blogsWithImages);
    console.log("blogs added to the database:", insertedBlogs);
    return insertedBlogs;
  } catch (error) {
    console.error("Error adding blogs to the database:", error);
    throw error;
  }
}
const blogsToAdd = [
  {
    title: "How To Combat Dental Anxiety?",
    image_path: "images/blog1.jpg",
    short_desc:
      "For many of us, going to the dentist is a stressful experience. We simply avoid going to the dentist when we have dental anxiety.",
    long_desc: "dummy desc",
    date: "Apr 9th, 2022",
  },
  {
    title: "Ways To Avoid Dental Cavities",
    image_path: "images/blog2.jpg",
    short_desc:
      "Although brushing and flossing are two important daily oral hygiene routines for maintaining the health of your teeth and gums, there are a few other simple things you can do to prevent tooth decay.",
    long_desc: "dummy desc",
    date: "Apr 6th, 2022",
  },
  {
    title: "Common Dental Problems:\nLets Not Ignore",
    image_path: "images/blog3.jpg",
    short_desc:
      "Tooth problems are nothing less than an emergency no matter how minor or major the problem might be. Dental problems are varied and knowing how to handle them can actually go a long way in preventing long term damage.",
    long_desc: "dummy desc",
    date: "Apr 6th, 2022",
  },
];

// Call the function to add blogs to the database
addBlogs(blogsToAdd)
  .then(() => console.log("blogs added successfully"))
  .catch((err) => console.error("Failed to add blogs:", err));

//===========================================================================================
//===========================================================================================

// faqs list API
app.get("/faq-list", async (req, res) => {
  const data = await Faq.find();
  console.log(data);
  res.send(data);
});

// Add FAQ route using multer for parsing FormData
app.post("/add-faq", upload.none(), async (req, res) => {
  const { question, answer } = req.body;

  try {
    // Create new FAQ in the database using async/await
    const newFaq = new Faq({
      question,
      answer,
    });
    const savedFaq = await newFaq.save();

    res.json({
      message: "FAQ added successfully",
      faq: savedFaq,
    });
  } catch (error) {
    console.error("Error adding FAQ:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update FAQ route using multer for parsing FormData
app.put("/faq-update/:_id", upload.none(), async (req, res) => {
  const { _id } = req.params;
  const { question, answer } = req.body;

  try {
    // Update FAQ details in the database using async/await
    const updatedFaq = await Faq.findByIdAndUpdate(
      _id,
      { question, answer },
      { new: true },
    );

    if (!updatedFaq) {
      console.error("Error updating FAQ: FAQ not found");
      return res.status(404).json({ error: "FAQ not found" });
    }

    res.json({
      message: "FAQ updated successfully",
      faq: updatedFaq,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Faq API
app.delete("/delete-faq/:_id", async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedFaq = await Faq.findByIdAndDelete(_id);
    if (!deletedFaq) {
      return res.status(404).json({ error: "Faq not found" });
    }
    res.json({ message: "Faq deleted successfully" });
  } catch (error) {
    console.error("Error deleting faq:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function addFaqs(faqs) {
  try {
    const faqsWithDate = faqs.map((faq) => {
      return {
        question: faq.question,
        answer: faq.answer,
      };
    });

    // Insert FAQs into the database
    const insertedFaqs = await Faq.insertMany(faqsWithDate);
    console.log("FAQs added to the database:", insertedFaqs);
    return insertedFaqs;
  } catch (error) {
    console.error("Error adding FAQs to the database:", error);
    throw error;
  }
}

const faqsToAdd = [
  {
    question: "Why should I consult Dr. Khushbu Singh?",
    answer:
      "Dr. Khushbu Singh is a specialist in Dental surgeon. She has more than 5 years of experience.",
  },
  {
    question: "Why is it best to consult a specialist?",
    answer:
      "A specialist doctor is trained to treat complex health conditions in their particular field. If you are diagnosed with a condition, it is best to consult a doctor who specializes in dealing with that particular condition.",
  },
  {
    question: "How can I book an appointment with Dr. Khushbu Singh?",
    answer: "You can book an appointment by clicking here.",
  },
  {
    question: "What are the different modes of consultation?",
    answer:
      "Dr. Khushbu Singh provides different modes of consultation for you to choose from as per your convenience. You can choose to book a clinic appointment in Pune or you can also consult the doctor online via video or telephonic call. Please click here to book an appointment.",
  },
  {
    question:
      "Are safety guidelines followed in Dr. Khushbu Singh's consultation chamber?",
    answer:
      "Yes, our staff and clinic follows all safety protocols and we take appropriate measures to ensure a safe environment for our patients, including social distancing and hand sanitizing stations.",
  },
  {
    question: "What if my query is not listed here?",
    answer:
      "If you have any more queries that aren't listed, you can email us or call us.",
  },
];

// Call the function to add FAQs to the database
addFaqs(faqsToAdd)
  .then(() => console.log("FAQs added successfully"))
  .catch((err) => console.error("Failed to add FAQs:", err));

//===========================================================================================
//===========================================================================================

// API for getting clinic details

app.get("/api/clinic-details", async (req, res) => {
  try {
    const clinicDetails = await ClinicDetails.findOne(); // Assumes only one clinic details document
    res.json(clinicDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update clinic details API
app.put(
  "/clinic-details-update/:_id",
  upload.single("imageUrl"),
  async (req, res) => {
    console.log("file", req.file, "file");
    try {
      const { name, address, opdHours } = req.body;
      const clinicId = req.params._id;

      // Parse the opdHours if it's a string
      let parsedOpdHours = [];
      if (typeof opdHours === "string") {
        parsedOpdHours = JSON.parse(opdHours);
      } else {
        parsedOpdHours = opdHours;
      }

      const updatedData = {
        name,
        address,
        opdHours: parsedOpdHours,
      };

      // If an image is uploaded, include the imageUrl in the update
      if (req.file) {
        updatedData.imageUrl = `${process.env.BASE_URL}/images/${req.file.filename}`;
      }

      const updatedClinic = await ClinicDetails.findByIdAndUpdate(
        clinicId,
        updatedData,
        { new: true },
      );

      if (!updatedClinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      res.status(200).json({
        message: "Clinic details updated successfully",
        clinic: updatedClinic,
      });
    } catch (error) {
      console.error("Error updating clinic details:", error);
      res.status(500).json({ message: "Error updating clinic details", error });
    }
  },
);

// Add some clinic details

async function addClinicDetails(clinicDetails) {
  try {
    const clinicDetailsWithImage = {
      ...clinicDetails,
      imageUrl: `${process.env.BASE_URL}/${clinicDetails.image_path}`,
    };

    // Insert clinic details into the database
    const insertedClinicDetails = await ClinicDetails.create(
      clinicDetailsWithImage,
    );
    console.log("Clinic details added to the database:", insertedClinicDetails);
    return insertedClinicDetails;
  } catch (error) {
    console.error("Error adding clinic details to the database:", error);
    throw error;
  }
}

const clinicDetailsToAdd = {
  name: "SUTRA DENTAL",
  address:
    "2nd floor - star plaza, Ahmedabad-Mehsana Highway, OPP sharda petroleum, Chandkheda, Ahmedabad - 382424",
  image_path: "images/clinicRoom.jpg",
  opdHours: [
    { day: "Monday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
    { day: "Tuesday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
    { day: "Wednesday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
    { day: "Thursday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
    { day: "Friday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
    { day: "Saturday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
    { day: "Sunday", opening_time: "9:00 AM", closing_time: "10:00 PM" },
  ],
};

// Call the function to add clinic details to the database
addClinicDetails(clinicDetailsToAdd)
  .then(() => console.log("Clinic details added successfully"))
  .catch((err) => console.error("Failed to add clinic details:", err));

//===========================================================================================
//===========================================================================================

// User Login API
app.post("/login", upload.none(), async (req, res) => {
  const { username, password } = req.body;

  console.log(username, req.body);

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    console.log(`User found: ${user}`);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials yo" });
    }

    // // Compare the password
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ error: "password not correct" });
    // }

    if (user.password !== password) {
      return res.status(400).json({ error: "Password not correct" });
    }

    // Generate a JWT token
    const payload = {
      user: {
        _id: user._id,
        username: user.username,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reusable transporter — created once at startup
const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Book Appointment API
app.post("/book-appointment", async (req, res) => {
  const { name, email, phone, date, time, treatment } = req.body;

  if (!name || !email || !phone || !date || !time || !treatment) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const mailOptions = {
      from: `"SUTRA DENTAL" <${process.env.MAIL_USER}>`,
      to: "vadviujjaval@gmail.com",
      subject: "New Appointment Booking",
      html: `
        <h2>New Appointment Booking</h2>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Field</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Details</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Name</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${name}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Email</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${email}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Phone</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${phone}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Date</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${date}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Time</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${time}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Treatment</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${treatment}</td>
          </tr>
        </table>
      `,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: "Appointment booked successfully. Email sent." });
  } catch (error) {
    console.error("Error sending appointment email:", error);
    res.status(500).json({ error: "Failed to send appointment email." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
