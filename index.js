const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const supabaseUrl = "https://cqovamdnptamfeftpvml.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb3ZhbWRucHRhbWZlZnRwdm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY3ODI0ODksImV4cCI6MjAyMjM1ODQ4OX0.br1jhVfkA9kbsfqda5-H2DNo2FE1Kwr6DehnrQ0LHWc";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const upload = multer();
const bodyParser = require("body-parser");

app.use(cors());
const corsOptions = {
  origin: "*", // semua bisa akses , nantikuubah ke domain
};
// // Agar bisa menerima payload berupa JSON
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.post("/login", async (req, res) => {
  try {
    const { nim, password } = req.body;

    // Cari pengguna berdasarkan nim
    const { data, error } = await supabase
      .from("users")
      .select("user_id, password, role, full_name")
      .eq("nim", nim)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verifikasi kata sandi
    if (data.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { user_id: data.user_id, role: data.role, full_name: data.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Atur waktu kadaluarsa token
    );

    const role = data.role;

    // Kirim token sebagai respons
    res.status(200).json({
      token,
      redirect: role === "mahasiswa" ? "dashboard" : "dashboard-admin",
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.post("/user", async (req, res) => {
  try {
    const { authorization } = req.headers;

    // Split the token by space
    const tokenParts = authorization.split(" ");
    // Extract the token part
    const token = tokenParts[1];

    // Cari pengguna berdasarkan nim
    const user = jwt.decode(token, process.env.JWT_SECRET);
    const isValid = jwt.verify(token, process.env.JWT_SECRET);

    if (!user || !isValid) {
      throw Error("User not login");
    }

    // Kirim token sebagai respons
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.get("/certificates/all-with-users", async (req, res) => {
  try {
    const { data: certificates, error: certError } = await supabase
      .from("certificates")
      .select("*")
      .not("status", "in", "(reject,approve)");

    if (certError) {
      throw certError;
    }

    const certificateData = await Promise.all(
      certificates.map(async (certificate) => {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("full_name, nim")
          .eq("user_id", certificate.user_id)
          .single();

        if (userError) {
          throw userError;
        }

        return { ...certificate, user };
      })
    );

    res.status(200).json({ success: true, certificates: certificateData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/certificates/all", async (req, res) => {
  try {
    const { data, error } = await supabase.from("certificates").select("*");
    if (error) {
      throw error;
    }
    res.status(200).json({ success: true, certificates: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.patch("/certificate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("certificates")
      .update({ status: status })
      .eq("cert_id", id)
      .select();

    if (error) {
      throw error;
    }
    console.log(req.body);
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*");

    if (error) {
      throw error;
    }
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.log("error:", error.message);
    res.status(500).json({ success: false, error: "internal server error" });
  }
});

app.get("/certificates/:user_id", async (req, res) => {
  try {
    const { data: certificates, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", req.params.user_id);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, certificates });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { user_id, title, status, tag_id } = req.body;
    const filePath = `${user_id}/${uuidv4()}_${file.originalname}`;

    const { data, error } = await supabase.storage
      .from("certificates")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw error;
    }
    const {
      data: { publicUrl },
      error: urlError,
    } = supabase.storage.from("certificates").getPublicUrl(filePath);

    const { data: insertedCertificate, error: dbError } = await supabase
      .from("certificates")
      .insert({
        user_id: user_id,
        title,
        file_path: publicUrl,
        status,
        tag_id: tag_id,
      });

    if (dbError) {
      throw new Error(`Error inserting to database: ${dbError.message}`);
    }
    if (urlError) {
      throw new Error(`Error getting file URL: ${urlError.message}`);
    }

    res
      .status(200)
      .json({ success: true, data: { publicUrl }, insertedCertificate });
    console.log({ publicUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/tags", async (req, res) => {
  try {
    const { name, category_id } = req.body;
    const { data, error } = await supabase
      .from("tags")
      .insert([{ name, category_id }]);
    if (error) {
      throw error;
    }
    res
      .status(201)
      .json({ success: true, message: "Tag created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }]);
    if (error) {
      throw error;
    }
    res
      .status(201)
      .json({ success: true, message: "Category created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Untuk GET TAGS
app.get("/tags", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tags").select("*");

    if (error) {
      throw error;
    }
    const tags = data.map((tag) => ({
      id: tag.tag_id,
      name: tag.name,
      value: tag.value,
      category_id: tag.category_id,
    }));
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/tagsall", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tags").select("*");

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
