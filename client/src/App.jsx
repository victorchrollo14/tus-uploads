import "./App.css";
import Dropzone from "react-dropzone";
import { useState } from "react";
import * as tus from "tus-js-client";

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadData, setUploadData] = useState({
    upload: {
      megabytes: 0,
      kilobytes: 0,
      bytes: 0,
    },
    total: 0,
  });

  const handleSubmit = async () => {
    if (uploadedFiles.length <= 0) {
      console.log("first upload a file before clicking on the button");
      return;
    }

    uploadedFiles.map((file) => {
      const upload = new tus.Upload(file, {
        endpoint: "http://localhost:4000/uploads",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },

        onError: errorHandler,
        onProgress: progressHandler,
      });

      upload.start();
    });
  };

  const errorHandler = async (error) => {
    console.log(error);
  };

  const progressHandler = async (bytesUploaded, totalBytes) => {
    const mbs = Math.floor(bytesUploaded / (1024 * 1024));
    const kbs = Math.floor((bytesUploaded % 1024) / 1024);
    const bytes = bytesUploaded % 1024;

    const totalMBs = Math.floor(totalBytes / (1024 * 1024));

    setUploadData({
      upload: { megabytes: mbs, kilobytes: kbs, bytes: bytes },
      total: totalMBs,
    });
  };
  console.log(
    `uploaded ${uploadData.upload.megabytes}Mb, ${uploadData.upload.kilobytes}Kb and ${uploadData.upload.bytes}bytes out of ${uploadData.total}Mbs`,
  );
  return (
    <>
      <div>
        <h1>Tus Upload </h1>

        <ul className="file-list">
          <h2>uploaded following files</h2>
          {uploadedFiles.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
        <Dropzone
          onDrop={(files) => setUploadedFiles([...uploadedFiles, ...files])}
        >
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                <div>
                  <h3>Drag and drop some files here.</h3>
                </div>
              </div>
            </section>
          )}
        </Dropzone>
        <button type="submit" className="btn" onClick={handleSubmit}>
          Upload
        </button>
      </div>
    </>
  );
}

export default App;
