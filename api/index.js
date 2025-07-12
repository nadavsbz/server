const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

app.post("/api/edit-image", async (req, res) => {
  const { image, prompt } = req.body;

  if (!image || !prompt) {
    return res.status(400).json({ error: "Missing image or prompt" });
  }

  try {
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "8f22e1f5784dd80b885183bc84fb38fdfca48aa31280043be8d0112c51d0f33b",
        input: {
          image: image,
          prompt: prompt
        }
      },
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const prediction = response.data;
    const getResult = async () => {
      const resultResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );
      const status = resultResponse.data.status;
      if (status === "succeeded") {
        return res.json({ output: resultResponse.data.output[0] });
      } else if (status === "failed") {
        return res.status(500).json({ error: "Model inference failed" });
      } else {
        setTimeout(getResult, 1000);
      }
    };

    setTimeout(getResult, 1000);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Image processing failed" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
