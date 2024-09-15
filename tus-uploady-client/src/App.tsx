import "./App.css";
import "./index.css";

import TusUploady, {
  useItemProgressListener,
  useBatchAddListener,
  useUploady,
  useAbortItem,
  BatchItem,
  useItemAbortListener,
  useItemStartListener,
  useAbortAll,
} from "@rpldy/tus-uploady";

import ProgressBar from "@ramonak/react-progress-bar";
import { useState } from "react";
import UploadButton from "@rpldy/upload-button";
import UploadDropZone from "@rpldy/upload-drop-zone";
import { MdCancel, MdDelete } from "react-icons/md";
import { FaRegCircleCheck } from "react-icons/fa6";

interface IUploadType extends BatchItem {
  uploadSpeed: number;
  timeLeft: number;
  startTime: Date | null;
}

function App() {
  const [uploadItems, setUploadItems] = useState<IUploadType[]>([]);
  const Uploader = TusUploady;
  const uploadProps = {
    destination: {
      url: "http://localhost:4000/uploads",
    },
    chunkSize: 12343, // 50MB
    sendDataOnCreate: true,
    sendWithFormData: true,
    autoUpload: false,
    // withCredentials: true,
  };

  const friendlyFormat = (bytes: number) => {
    const kiloBytes = bytes / 1024;
    if (kiloBytes < 1024) return `${Math.floor(kiloBytes)} KB`;
    const megaBytes = kiloBytes / 1024;
    if (megaBytes < 1024) return `${Math.floor(megaBytes)} MB`;
    const gigaBytes = megaBytes / 1024;
    if (gigaBytes < 1024) return `${gigaBytes.toFixed(1)}GB`;
  };

  const DropZoneArea = () => {
    const { processPending } = useUploady();
    // const uploady = useUploady();

    const AbortButton = () => {
      const abortAll = useAbortAll();

      const handleAbortAll = () => {
        console.log("aborting all uploads");
        abortAll();
      };
      return (
        <button
          className="bg-red-500 px-2 py-2 rounded-lg"
          onClick={handleAbortAll}
        >
          Stop uploading
        </button>
      );
    };

    return (
      <>
        <UploadDropZone
          className="border border-dashed rounded-lg border-black h-40 w-80 flex justify-center items-center hover:scale-105"
          onDragOverClassName="scale-105"
        >
          <span>Drag and drop some files here or</span>
          <UploadButton className="underline text-blue-400">
            Add files
          </UploadButton>
        </UploadDropZone>
        {uploadItems.length ? (
          <>
            <button
              className="bg-green-500 px-2 py-2 rounded-lg"
              onClick={processPending}
            >
              Start uploading
            </button>
            <AbortButton />
          </>
        ) : null}{" "}
      </>
    );
  };

  const calculateUploadSpeedAndTimeLeft = (
    startTime: Date,
    loaded: number,
    total: number,
  ) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; // convert ms to seconds
    const uploadSpeed = loaded / elapsedTime; // bytes per second
    const remainingBytes = total - loaded;
    const timeLeft = (remainingBytes / uploadSpeed).toFixed(2); // seconds
    return { uploadSpeed, timeLeft };
  };

  function formatTime(seconds: number) {
    const SECONDS_IN_A_MINUTE = 60;
    const SECONDS_IN_AN_HOUR = 3600;
    const SECONDS_IN_A_DAY = 86400;

    if (seconds >= SECONDS_IN_A_DAY) {
      const days = Math.floor(seconds / SECONDS_IN_A_DAY);
      const hours = Math.floor(
        (seconds % SECONDS_IN_A_DAY) / SECONDS_IN_AN_HOUR,
      );
      return `${days} day${days > 1 ? "s" : ""}, ${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (seconds >= SECONDS_IN_AN_HOUR) {
      const hours = Math.floor(seconds / SECONDS_IN_AN_HOUR);
      const minutes = Math.floor(
        (seconds % SECONDS_IN_AN_HOUR) / SECONDS_IN_A_MINUTE,
      );
      return `${hours} hour${hours > 1 ? "s" : ""}, ${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else if (seconds >= SECONDS_IN_A_MINUTE) {
      const minutes = Math.floor(seconds / SECONDS_IN_A_MINUTE);
      const remainingSeconds = (seconds % SECONDS_IN_A_MINUTE).toFixed();
      return `${minutes} minute${minutes > 1 ? "s" : ""}, ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;
    } else {
      return `${seconds} second${seconds > 1 ? "s" : ""}`;
    }
  }

  const FilesProgress = () => {
    useItemProgressListener((item) => {
      setUploadItems((prevState) => {
        return prevState.map((prevItem) => {
          if (prevItem.id === item.id) {
            const { uploadSpeed, timeLeft } = calculateUploadSpeedAndTimeLeft(
              prevItem.startTime as Date,
              item.loaded,
              item.file.size,
            );
            return {
              ...item,
              uploadSpeed: uploadSpeed,
              timeLeft: timeLeft,
              startTime: prevItem.startTime,
            };
          }
          return prevItem;
        });
      });
    });

    useItemStartListener((item) => {
      console.log(item.file.name + "started uploading");
      setUploadItems((prevState) => {
        return prevState.map((prevItem) => {
          if (prevItem.id === item.id)
            return {
              ...item,
              uploadSpeed: 0,
              timeLeft: 0,
              startTime: Date.now(),
            };
          return prevItem;
        });
      });
    });

    useBatchAddListener((batch) => {
      console.log("item added");
      const UploadData = batch.items.map((item) => {
        return { ...item, uploadSpeed: 0, timeLeft: 0, startTime: null };
      });
      setUploadItems((prevState) => [...prevState, ...UploadData]);
    });

    useItemAbortListener((item) => {
      console.log(item.file.name + "was removed");
      setUploadItems((prevState) =>
        prevState.filter((uploadItem) => uploadItem.id !== item.id),
      );
    });

    const abortItem = useAbortItem();

    const handleCancel = (id: string) => {
      abortItem(id);
    };

    console.log(uploadItems);
    return (
      <div className="files-progress max-h-[60vh]  overflow-scroll flex flex-col  gap-3 justify-center">
        {uploadItems.map((item) => (
          <div
            key={item.id}
            className="flex w-[70vw] flex-row gap-2 relative border border-black p-5"
          >
            <div>
              <img
                src={URL.createObjectURL(item.file as File)}
                className="h-[150px] w-[150px]"
              />
            </div>
            <div className="flex   flex-col flex-1 justify-between">
              <span>
                <h6>{item.file.name}</h6>
                {item.state === "uploading" && (
                  <h2>{friendlyFormat(item.uploadSpeed)}/s - </h2>
                )}
                <p>
                  {friendlyFormat(item.loaded)} out of{" "}
                  {friendlyFormat(item.file.size)}
                </p>

                {item.state === "uploading" && (
                  <h4>{formatTime(item.timeLeft)} Left</h4>
                )}
                {item.state === "finished" && (
                  <h4 className="text-green-500 flex flex-row text-center gap-2">
                    <span>Uploaded</span>
                    <FaRegCircleCheck />
                  </h4>
                )}
              </span>
              <ProgressBar completed={item.completed} bgColor="green" />
              {item.state === "pending" && (
                <MdCancel
                  className="h-5 w-5 absolute top-3 right-2 cursor-pointer "
                  onClick={() => handleCancel(item.id)}
                />
              )}
              {item.state === "finished" && (
                <MdDelete className="h-5 w-5 text-red-600 absolute top-3 right-2 cursor-pointer " />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className=" w-full flex flex-col gap-3 justify-center">
        <Uploader {...uploadProps}>
          <FilesProgress />
          {/* <DropZoneArea /> */}
          <div className="w-full flex flex-col justify-center items-center gap-2">
            <DropZoneArea />
          </div>
        </Uploader>
      </div>
    </>
  );
}

export default App;
