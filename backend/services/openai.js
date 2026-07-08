const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function reviewScreen(data) {
  const { selectedNode } = data;

  const completion = await client.chat.completions.create({
    model: "openai/gpt-oss-120b:free",

    messages: [
      {
        role: "system",
        content: `
          Anda adalah Senior UI/UX Reviewer dengan pengalaman lebih dari 10 tahun.
          
          WAJIB:
          
          - Selalu jawab dalam Bahasa Indonesia
          - Output HARUS berupa JSON valid
          - DILARANG keras mengoutput teks lain selain JSON
          - DILARANG markdown, penjelasan, atau code block
          
          ATURAN KRITIS:

            1. Jangan melakukan review berdasarkan:
            - nama layer
            - nama node
            - nama frame
            - struktur folder Figma
            - naming internal design system

            2. Nama layer hanya konteks internal, bukan UI yang terlihat oleh user.

            3. Abaikan seluruh node yang tidak terlihat (hidden).
            - Jangan melakukan review pada node dengan visible = false.
            - Jangan memasukkan hidden layer ke analisis UX, UI, Accessibility, maupun Design System.
            - Hidden layer dianggap tidak ada dalam tampilan akhir yang dilihat user.

            4. Fokus hanya pada:
            - UX (user flow, usability)
            - UI (visual hierarchy, spacing, color, typography)
            - Accessibility (kontras, label, readability)
            - Design System consistency

            5. Jangan mengarang data yang tidak ada.
            Jika tidak yakin, tulis: "Perlu Verifikasi".

            6. Jangan berasumsi konten visual jika tidak ada data.

            7. Jangan memberikan issue atau rekomendasi berdasarkan elemen yang:
            - hidden
            - tidak visible
            - tidak dirender ke user

            8. Review hanya berdasarkan elemen yang benar-benar terlihat pada canvas akhir.
          
          FORMAT OUTPUT WAJIB:
          
          {
            "summary": "string",
            "scores": {
              "ux": number,
              "ui": number,
              "accessibility": number,
              "design_system": number
            },
            "ux_issues": ["string"],
            "ui_issues": ["string"],
            "accessibility_issues": ["string"],
            "design_system_issues": ["string"],
            "recommendations": ["string"]
          }
          
          RULE OUTPUT:
          
          - HARUS JSON valid 100%
          - Tidak boleh ada koma terakhir error
          - Tidak boleh ada text sebelum/sesudah JSON
          - Tidak boleh markdown formatting
          `,
      },
      {
        role: "user",
        content: `
          Analisis frame Figma berikut:
          
          ${JSON.stringify(selectedNode, null, 2)}
          
          Berikan hasil review sesuai format JSON yang sudah ditentukan.
          `,
      },
    ],
  });

  return completion.choices[0].message.content;
}

module.exports = {
  reviewScreen,
};

