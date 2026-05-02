import fetch from "node-fetch";

export async function uploadToDropbox(filePath: string, content: Buffer) {
  const token = process.env.DROPBOX_TOKEN;
  if (!token) throw new Error("Missing DROPBOX_TOKEN");

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: filePath, mode: "overwrite" }),
      "Content-Type": "application/octet-stream"
    },
    body: content
  });

  if (!res.ok) throw new Error("Dropbox upload failed");
  return res.json();
}
