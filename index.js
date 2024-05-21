const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const XLSX = require("xlsx");
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

const uploadImageToSupabase = async (file) => {
  const filePath = `${uuidv4()}_${file.originalname}`;
  const { data, error } = await supabase.storage
    .from("certificates")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData, error: urlError } = supabase.storage
    .from("certificates")
    .getPublicUrl(filePath);

  if (urlError) {
    throw urlError;
  }

  return publicUrlData.publicUrl;
};

app.post(
  "/admin/upload",
  upload.fields([{ name: "file" }, { name: "image" }]),
  async (req, res) => {
    try {
      const file = req.files.file[0];
      const image = req.files.image[0];

      if (!file || !image) {
        return res.status(400).json({ error: "No file or image uploaded" });
      }

      const image_url = await uploadImageToSupabase(image);

      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const certificates = [];

      for (const row of data) {
        const { nim, tag } = row;

        const { data: users, error: userError } = await supabase
          .from("users")
          .select("user_id")
          .eq("nim", nim)
          .single();

        if (userError || !users) {
          console.warn(`User with NIM ${nim} not found`);
          continue;
        }

        const { data: tags, error: tagError } = await supabase
          .from("tags")
          .select("tag_id")
          .eq("name", tag)
          .single();

        if (tagError || !tags) {
          console.warn(`Tag with name ${tag_name} not found`);
          continue;
        }

        const newCertificate = {
          user_id: users.user_id,
          title: "Certificate from admin 1",
          file_path: image_url,
          status: "approve",
          tag_id: tags.tag_id,
        };

        certificates.push(newCertificate);
      }

      const { data: insertedCertificates, error: dbError } = await supabase
        .from("certificates")
        .insert(certificates);

      if (dbError) {
        throw new Error(`Error inserting to database: ${dbError.message}`);
      }

      res.status(200).json({ success: true, data: insertedCertificates });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get("/user/:user_id/mahasiswa", async (req, res) => {
  try {
    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, nim")
      .eq("user_id", req.params.user_id)
      .single();

    if (userError || !userData) {
      throw new Error("User not found");
    }

    // Fetch certificates data for the user
    const { data: certificates, error: certError } = await supabase
      .from("certificates")
      .select("tag_id, title")
      .eq("user_id", req.params.user_id)
      .eq("status", "approve");

    if (certError) {
      throw new Error("Failed to fetch certificates data");
    }

    // console.log("certificate", certificates);
    const tagIds = certificates.map((certificate) => certificate.tag_id);

    // Fetch tags data for the certificates
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("tag_id, name, value, category_id")
      .in("tag_id", tagIds);

    if (tagsError) {
      throw new Error("Failed to fetch tags data");
    }

    // Fetch categories data for the tags
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("category_id, name");

    if (categoriesError) {
      throw new Error("Failed to fetch categories data");
    }

    // Calculate total points for each category
    const totalPoints = certificates.reduce((temp, certificate) => {
      const tag = tags.find((tag) => certificate.tag_id == tag.tag_id);
      const category = categories.find(
        (category) => category.category_id === tag.category_id
      );

      if (!temp[category.name]) {
        temp[category.name] = tag.value;
      } else {
        temp[category.name] += tag.value;
      }

      return temp;
    }, {});

    res.status(200).json({
      success: true,
      user: {
        full_name: userData.full_name,
        nim: userData.nim,
        totalPoints: totalPoints,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.get("/users/mahasiswa", async (req, res) => {
  try {
    // Ambil data pengguna mahasiswa
    const { data: mahasiswa, error: mahasiswaError } = await supabase
      .from("users")
      .select("user_id, full_name, nim")
      .eq("role", "mahasiswa"); // Filter hanya untuk peran "mahasiswa"

    if (mahasiswaError) {
      throw mahasiswaError;
    }

    // Ambil sertifikat untuk setiap pengguna mahasiswa
    const mahasiswaWithCertificates = await Promise.all(
      mahasiswa.map(async (user) => {
        const { data: certificates, error: certError } = await supabase
          .from("certificates")
          .select("tag_id")
          .eq("user_id", user.user_id)
          .eq("status", "approve");

        if (certError) {
          throw certError;
        }

        // Ambil nilai (value) dari setiap tag dan jumlahkan
        const totalPoints = await Promise.all(
          certificates.map(async (certificate) => {
            const { data: tag, error: tagError } = await supabase
              .from("tags")
              .select("value")
              .eq("tag_id", certificate.tag_id)
              .single();

            if (tagError) {
              throw tagError;
            }

            return tag.value;
          })
        );

        // Jumlahkan total poin untuk pengguna
        const totalPointsSum = totalPoints.reduce((acc, curr) => acc + curr, 0);

        // Tambahkan total poin ke dalam data pengguna
        return { ...user, totalPoints: totalPointsSum };
      })
    );

    res.status(200).json(mahasiswaWithCertificates);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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
      { expiresIn: "5h" } // Atur waktu kadaluarsa token
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
    const { status, reason } = req.body;

    const { data, error } = await supabase
      .from("certificates")
      .update({ status: status, reason: reason })
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
    const { name, value, category_id } = req.body;
    const { data, error } = await supabase
      .from("tags")
      .insert([{ name, value, category_id }]);
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
