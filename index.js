const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const XLSX = require("xlsx");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { startOfMonth, endOfMonth, format, toDate } = require("date-fns");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const upload = multer();
const bodyParser = require("body-parser");
const { sumBy } = require("lodash");

app.use(cors());
const corsOptions = {
  origin: "*", // semua bisa akses , nantikuubah ke domain
};

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
          title: "Certificate From Kemahasiswaan",
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

// app.get("/user/:user_id/mahasiswa", async (req, res) => {
//   try {
//     // Fetch user data
//     const { data: userData, error: userError } = await supabase
//       .from("users")
//       .select("full_name, nim")
//       .eq("user_id", req.params.user_id)
//       .single();

//     if (userError || !userData) {
//       throw new Error("User not found");
//     }

//     // Fetch certificates data for the user
//     const { data: certificates, error: certError } = await supabase
//       .from("certificates")
//       .select("tag_id, title")
//       .eq("user_id", req.params.user_id)
//       .eq("status", "approve");

//     if (certError) {
//       throw new Error("Failed to fetch certificates data");
//     }

//     // console.log("certificate", certificates);
//     const tagIds = certificates.map((certificate) => certificate.tag_id);

//     // Fetch tags data for the certificates
//     const { data: tags, error: tagsError } = await supabase
//       .from("tags")
//       .select("tag_id, name, value, category_id")
//       .in("tag_id", tagIds);

//     if (tagsError) {
//       throw new Error("Failed to fetch tags data");
//     }

//     // Fetch categories data for the tags
//     const { data: categories, error: categoriesError } = await supabase
//       .from("categories")
//       .select("category_id, name, min_point");

//     if (categoriesError) {
//       throw new Error("Failed to fetch categories data");
//     }

//     // Calculate total points for each category
//     const totalPoints = certificates.reduce((temp, certificate) => {
//       const tag = tags.find((tag) => certificate.tag_id == tag.tag_id);
//       const category = categories.find(
//         (category) => category.category_id === tag.category_id
//       );

//       if (!temp[category.name]) {
//         temp[category.name] = tag.value;
//       } else {
//         temp[category.name] += tag.value;
//       }

//       return temp;
//     }, {});

//     const min_point = categories.min_point;

//     res.status(200).json({
//       success: true,
//       user: {
//         full_name: userData.full_name,
//         nim: userData.nim,
//         totalPoints: totalPoints,
//         cat: min_point,
//       },
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// });

// app.get("/user/:user_id/mahasiswa", async (req, res) => {
//   try {
//     // Fetch user data
//     const { data: userData, error: userError } = await supabase
//       .from("users")
//       .select("full_name, nim")
//       .eq("user_id", req.params.user_id)
//       .single();

//     if (userError || !userData) {
//       throw new Error("User not found");
//     }

//     // Fetch certificates data for the user
//     const { data: certificates, error: certError } = await supabase
//       .from("certificates")
//       .select("tag_id, title")
//       .eq("user_id", req.params.user_id)
//       .eq("status", "approve");

//     if (certError) {
//       throw new Error("Failed to fetch certificates data");
//     }

//     // Get tagIds from certificates
//     const tagIds = certificates.map((certificate) => certificate.tag_id);

//     // Fetch tags data for the certificates
//     const { data: tags, error: tagsError } = await supabase
//       .from("tags")
//       .select("tag_id, name, value, category_id")
//       .in("tag_id", tagIds);

//     if (tagsError) {
//       throw new Error("Failed to fetch tags data");
//     }

//     // Fetch categories data for the tags
//     const { data: categories, error: categoriesError } = await supabase
//       .from("categories")
//       .select("category_id, name, min_point");

//     if (categoriesError) {
//       throw new Error("Failed to fetch categories data");
//     }

//     // Initialize totalPoints with all categories and min_point
//     const totalPoints = {};
//     categories.forEach((category) => {
//       totalPoints[category.name] = { points: 0, min_point: category.min_point };
//     });

//     // Calculate total points for each category
//     certificates.forEach((certificate) => {
//       const tag = tags.find((tag) => certificate.tag_id == tag.tag_id);
//       const category = categories.find(
//         (category) => category.category_id === tag.category_id
//       );
//       if (category) {
//         totalPoints[category.name].points += tag.value;
//       }
//     });

//     // Prepare the response
//     res.status(200).json({
//       success: true,
//       user: {
//         full_name: userData.full_name,
//         nim: userData.nim,
//         totalPoints: totalPoints,
//       },
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// });
app.get("/user/:user_id/mahasiswa", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, error: "User ID is required" });
  }

  try {
    const user = await getUserData(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const certificates = await getCertificates(user_id);
    const tags = await getTags(certificates);
    const categories = await getCategories();

    const totalPoints = calculateTotalPoints(certificates, tags, categories);

    res.status(200).json({
      full_name: user.full_name,
      nim: user.nim,
      totalPoints: totalPoints,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const getUserData = async (user_id) => {
  const { data, error } = await supabase
    .from("users")
    .select("full_name, nim")
    .eq("user_id", user_id)
    .single();

  if (error) throw new Error("Failed to fetch user data");
  return data;
};

const getCertificates = async (user_id) => {
  const { data, error } = await supabase
    .from("certificates")
    .select("tag_id, title")
    .eq("user_id", user_id)
    .eq("status", "approve");

  if (error) throw new Error("Failed to fetch certificates data");
  return data;
};

const getTags = async (certificates) => {
  const tagIds = certificates.map((certificate) => certificate.tag_id);
  const { data, error } = await supabase
    .from("tags")
    .select("tag_id, name, value, category_id")
    .in("tag_id", tagIds);

  if (error) throw new Error("Failed to fetch tags data");
  return data;
};

const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("category_id, name, min_point");

  if (error) throw new Error("Failed to fetch categories data");
  return data;
};

const calculateTotalPoints = (certificates, tags, categories) => {
  const totalPoints = {};
  categories.forEach((category) => {
    totalPoints[category.name] = { points: 0, min_point: category.min_point };
  });

  certificates.forEach((certificate) => {
    const tag = tags.find((tag) => certificate.tag_id == tag.tag_id);
    const category = categories.find(
      (category) => category.category_id === tag.category_id
    );
    if (category) {
      totalPoints[category.name].points += tag.value;
    }
  });

  return totalPoints;
};

const getApprovedCertificates = (certificates) => {
  return certificates.filter((certificate) => certificate.status === "approve");
};

const getApprovedCurrentMonthCertificates = (certificates) => {
  return getApprovedCertificates(certificates).filter((certificate) => {
    const certificateTimeStamp = new Date(certificate.time_stamp);

    return (
      certificateTimeStamp >= startOfMonth(new Date()) &&
      certificateTimeStamp <= endOfMonth(new Date())
    );
  });
};

app.get("/users/mahasiswa", async (req, res) => {
  try {
    // Ambil data pengguna mahasiswa
    const { data: mahasiswa, error: mahasiswaError } = await supabase
      .from("users")
      .select("user_id, full_name, nim, certificates(*, tag:tag_id(*))")
      .eq("role", "mahasiswa"); // Filter hanya untuk peran "mahasiswa"

    if (mahasiswaError) {
      throw mahasiswaError;
    }

    const formattedMahasiswa = mahasiswa.map((user) => {
      return {
        ...user,
        totalPoints: sumBy(
          getApprovedCertificates(user.certificates),
          "tag.value"
        ),
        currentMonthPoints: sumBy(
          getApprovedCurrentMonthCertificates(user.certificates),
          "tag.value"
        ),
      };
    });

    // Ambil sertifikat untuk setiap pengguna mahasiswa
    // const mahasiswaWithCertificates = await Promise.all(
    //   mahasiswa.map(async (user) => {
    //     const { data: certificates, error: certError } = await supabase
    //       .from("certificates")
    //       .select("tag_id, time_stamp") // Tambahkan time_stamp ke hasil seleksi
    //       .eq("user_id", user.user_id)
    //       .eq("status", "approve");

    //     if (certError) {
    //       throw certError;
    //     }

    //     // Ambil nilai (value) dari setiap tag dan jumlahkan
    //     const totalPoints = await Promise.all(
    //       certificates.map(async (certificate) => {
    //         const { data: tag, error: tagError } = await supabase
    //           .from("tags")
    //           .select("value")
    //           .eq("tag_id", certificate.tag_id)
    //           .single();

    //         if (tagError) {
    //           throw tagError;
    //         }

    //         return {
    //           value: tag.value,
    //           time_stamp: certificate.time_stamp, // Sertakan time_stamp dalam hasil
    //         };
    //       })
    //     );

    //     // Filter sertifikasi yang terjadi dalam satu bulan terakhir
    //     const today = new Date();
    //     const lastMonth = new Date(today);
    //     lastMonth.setMonth(lastMonth.getMonth() - 1);

    //     const pointsLastMonth = totalPoints
    //       .filter((cert) => new Date(cert.time_stamp) > lastMonth)
    //       .reduce((acc, curr) => acc + curr.value, 0);

    //     // Tambahkan total poin ke dalam data pengguna
    //     return { ...user, totalPoints: pointsLastMonth };
    //   })
    // );

    res.status(200).json(formattedMahasiswa);
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

// Update category
app.put("/category/:id", async (req, res) => {
  const { id } = req.params;
  const { name, min_point, is_visible } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (min_point !== undefined) updates.min_point = min_point;
  if (is_visible !== undefined) updates.is_visible = is_visible;

  try {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("category_id", id);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update activity
app.put("/activity/:id", async (req, res) => {
  const { id } = req.params;
  const { name, is_visible } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (is_visible !== undefined) updates.is_visible = is_visible;

  try {
    const { data, error } = await supabase
      .from("activities")
      .update(updates)
      .eq("activity_id", id);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tag
app.put("/tag/:id", async (req, res) => {
  const { id } = req.params;
  const { name, value, is_visible } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (value !== undefined) updates.value = value;
  if (is_visible !== undefined) updates.is_visible = is_visible;

  try {
    const { data, error } = await supabase
      .from("tags")
      .update(updates)
      .eq("tag_id", id);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

app.get("/certificates/approved-categories", async (req, res) => {
  try {
    // Fetch all approved certificates
    const { data: certificates, error: certError } = await supabase
      .from("certificates")
      .select("*")
      .eq("status", "approve");

    if (certError) {
      throw certError;
    }

    const categoryCounts = {};

    for (const certificate of certificates) {
      const { tag_id } = certificate;

      // Fetch tag information
      const { data: tag, error: tagError } = await supabase
        .from("tags")
        .select("activity_id")
        .eq("tag_id", tag_id)
        .single();

      if (tagError) {
        throw tagError;
      }

      // Fetch activity information
      const { data: activity, error: activityError } = await supabase
        .from("activities")
        .select("category_id")
        .eq("activity_id", tag.activity_id)
        .single();

      if (activityError) {
        throw activityError;
      }

      // Fetch category information
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("name")
        .eq("category_id", activity.category_id)
        .single();

      if (categoryError) {
        throw categoryError;
      }

      const categoryName = category.name;
      if (categoryCounts[categoryName]) {
        categoryCounts[categoryName] += 1;
      } else {
        categoryCounts[categoryName] = 1;
      }
    }

    const totalCategories = Object.keys(categoryCounts).length;
    const totalCertificates = certificates.length;
    const averageCertificates = totalCategories
      ? totalCertificates / totalCategories
      : 0;

    res.status(200).json({
      success: true,
      totalCategories,
      totalCertificates,
      averageCertificates,
      categoryCounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

app.get("/management", async (req, res) => {
  try {
    // Ambil semua kategori (categories)
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("*");

    if (categoriesError) {
      throw categoriesError;
    }

    // Ambil semua activities beserta kategori dan tags
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("*");

    if (activitiesError) {
      throw activitiesError;
    }

    // Ambil semua tags
    const { data: tagsData, error: tagsError } = await supabase
      .from("tags")
      .select("*");

    if (tagsError) {
      throw tagsError;
    }

    // Susun data sesuai dengan struktur yang diminta
    const combinedData = categoriesData.map((category) => {
      // Filter activities yang memiliki category_id sesuai dengan kategori saat ini
      const categoryActivities = activitiesData
        .filter((activity) => activity.category_id === category.category_id)
        .map((activity) => {
          // Ambil tags yang terkait dengan activity saat ini
          const activityTags = tagsData
            .filter((tag) => tag.activity_id === activity.activity_id)
            .map((tag) => ({
              id: tag.tag_id,
              name: tag.name,
              value: tag.value,
              is_visible: tag.is_visible,
            }));

          // Return activity dengan tags-nya
          return {
            id: activity.activity_id,
            name: activity.name,
            is_visible: activity.is_visible,
            // category_id: activity.category_id,
            tags: activityTags,
          };
        });

      // Return category dengan activities yang terkait
      return {
        id: category.category_id,
        name: category.name,
        min_point: category.min_point,
        is_visible: category.is_visible,
        activities: categoryActivities,
      };
    });

    res.status(200).json(combinedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const { data, error } = await supabase.from("categories").select("*");

    if (error) {
      throw error;
    }

    const categories = data.map((category) => ({
      id: category.category_id,
      name: category.name,
      min: category.min_point,
      is_visible: category.is_visible,
    }));
    categories.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

app.delete("/certificates/:cert_id", async (req, res) => {
  try {
    const { cert_id } = req.params;
    const { data, error } = await supabase
      .from("certificates")
      .delete()
      .eq("cert_id", cert_id);

    if (error) {
      throw error;
    }

    res
      .status(200)
      .json({ success: true, message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { user_id, title, status, tag_id, activity_date } = req.body;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }
    if (!user_id || !title || !tag_id || !activity_date) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const filePath = `${user_id}/${uuidv4()}_${file.originalname}`;
    const formattedActivityDate = moment(activity_date).format();

    // Check if there's already a certificate with the same tag_id and activity_date
    const { data: existingCertificates, error: queryError } = await supabase
      .from("certificates")
      .select("*")
      .eq("tag_id", tag_id)
      .eq("activity_date", formattedActivityDate);

    if (queryError) {
      throw queryError;
    }

    // If there are existing certificates with the same tag_id and activity_date, reject the upload
    if (existingCertificates && existingCertificates.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Certificate with the same tag on the same activity date already exists",
      });
    }

    const { data, error } = await supabase.storage
      .from("certificates")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

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
        status: status || "pending",
        tag_id: tag_id,
        activity_date: formattedActivityDate,
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
  } catch (error) {
    console.error(error);
    if (error.message.includes("time zone")) {
      return res.status(500).json({
        success: false,
        error:
          "Invalid time zone format. Please provide a valid time zone offset.",
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     const { user_id, title, status, tag_id, activity_date } = req.body;

//     if (!file) {
//       return res
//         .status(400)
//         .json({ success: false, error: "No file uploaded" });
//     }
//     if (!user_id || !title || !tag_id) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Missing required fields" });
//     }

//     const filePath = `${user_id}/${uuidv4()}_${file.originalname}`;
//     const formattedActivityDate = moment(activity_date).toISOString();

//     const { data: existingCertificates, error: fetchError } = await supabase
//       .from("certificates")
//       .select()
//       .eq("tag_id", tag_id)
//       .eq("activity_date", formattedActivityDate)
//       .single();

//     if (fetchError) {
//       throw fetchError;
//     }

//     if (existingCertificates) {
//       return res.status(400).json({
//         success: false,
//         error: "Certificate with the same tag and activity date already exists",
//       });
//     }

//     const { data, error } = await supabase.storage
//       .from("certificates")
//       .upload(filePath, file.buffer, {
//         contentType: file.mimetype,
//       });

//     if (error) {
//       throw error;
//     }
//     const {
//       data: { publicUrl },
//       error: urlError,
//     } = supabase.storage.from("certificates").getPublicUrl(filePath);

//     const { data: insertedCertificate, error: dbError } = await supabase
//       .from("certificates")
//       .insert({
//         user_id: user_id,
//         title,
//         file_path: publicUrl,
//         status,
//         tag_id: tag_id,
//         activity_date: formattedActivityDate,
//       })
//       .single();

//     if (dbError) {
//       throw new Error(`Error inserting to database: ${dbError.message}`);
//     }
//     if (urlError) {
//       throw new Error(`Error getting file URL: ${urlError.message}`);
//     }

//     res
//       .status(200)
//       .json({ success: true, data: { publicUrl }, insertedCertificate });
//     console.log({ publicUrl });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

app.post("/categories", async (req, res) => {
  try {
    const { name, min_point } = req.body;
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, min_point }]);
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

app.post("/tags", async (req, res) => {
  try {
    const { category_id, activity_id, value, name } = req.body;

    // Validasi input
    if (!category_id || !activity_id || !value || !name) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    // Insert ke dalam tabel tags di Supabase
    const { data, error } = await supabase
      .from("tags")
      .insert([{ category_id, activity_id, value, name }])
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/activities", async (req, res) => {
  try {
    const { category_id, name } = req.body; // Destructure 'category_id' dan 'name' dari req.body

    // Insert ke dalam tabel activities di Supabase
    const { data, error } = await supabase
      .from("activities")
      .insert([{ category_id, name }])
      .single(); // Mengembalikan hasil tunggal dari operasi insert

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/categories/:category_id/tags", async (req, res) => {
  try {
    const { category_id } = req.params; // Get the category_id from URL parameters

    if (!category_id) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("category_id", category_id); // Filter tags by category_id

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

app.get("/categories/:categoryId/activities", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("category_id", categoryId);

    if (error) {
      throw error;
    }

    const activities = data.map((activity) => ({
      id: activity.activity_id,
      name: activity.name,
      category_id: activity.category_id,
      is_visible: activity.is_visible,
    }));
    activities.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/activities/:activityId/tags", async (req, res) => {
  try {
    const { activityId } = req.params;
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("activity_id", activityId);

    if (error) {
      throw error;
    }

    const tags = data.map((tag) => ({
      id: tag.tag_id,
      name: tag.name,
      value: tag.value,
      activity_id: tag.activity_id,
      is_visible: tag.is_visible,
    }));
    tags.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      activity_id: tag.activity_id,
    }));
    tags.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/activities", async (req, res) => {
  try {
    const { data, error } = await supabase.from("activities").select("*");

    if (error) {
      throw error;
    }
    const activities = data.map((activity) => ({
      id: activity.activity_id,
      name: activity.name,
      category_id: activity.category_id,
    }));
    res.status(200).json(activities);
    console.log(activities);
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

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
