
import {
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.querySelector("#webcam");
const canvas = document.querySelector("#overlay");
const ctx = canvas.getContext("2d");

const statusText = document.querySelector("#status");
const faceCount = document.querySelector("#faceCount");
const fpsText = document.querySelector("#fps");
const landmarkCount = document.querySelector("#landmarkCount");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const placeholder = document.querySelector("#placeholder");

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarker = null;
let stream = null;
let animationId = null;
let running = false;
let lastVideoTime = -1;
let lastFpsTime = 0;
let frames = 0;

function setStatus(message) {
    statusText.textContent = `● ${message}`;
}

async function loadModel() {
    if (landmarker) return;

    setStatus("Loading AI model...");

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: MODEL_URL
        },
        runningMode: "VIDEO",
        numFaces: 1
    });
}

async function startCamera() {
    if (running) return;

    startButton.disabled = true;

    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error(
                "Camera access is unavailable. Open this page using HTTPS or localhost."
            );
        }

        await loadModel();

        setStatus("Requesting camera permission...");

        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        video.classList.add("active");
        placeholder.hidden = true;

        running = true;
        lastVideoTime = -1;
        lastFpsTime = performance.now();
        frames = 0;

        stopButton.disabled = false;
        setStatus("Camera active");

        renderFrame();
    } catch (error) {
        console.error(error);

        stopCamera();

        if (error.name === "NotAllowedError") {
            setStatus("Camera permission denied");
        } else if (error.name === "NotFoundError") {
            setStatus("No camera found");
        } else {
            setStatus("Error: " + error.message);
        }
    } finally {
        startButton.disabled = running;
    }
}

function renderFrame() {
    if (!running) return;

    if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTime
    ) {
        lastVideoTime = video.currentTime;

        const results = landmarker.detectForVideo(
            video,
            performance.now()
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const faces = results.faceLandmarks ?? [];
        faceCount.textContent = faces.length;

        const drawing = new DrawingUtils(ctx);

        for (const landmarks of faces) {
            landmarkCount.textContent = landmarks.length;

            // Purple: facial landmark points.
            for (const point of landmarks) {
                ctx.beginPath();
                ctx.arc(
                    point.x * canvas.width,
                    point.y * canvas.height,
                    1.1,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = "#9AADC8";
                ctx.fill();
            }

            // Green: eye contours.
            drawing.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                { color: "#49F2A4", lineWidth: 2 }
            );

            drawing.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                { color: "#49F2A4", lineWidth: 2 }
            );

            // Orange: lip contours.
            drawing.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LIPS,
                { color: "#FFAD66", lineWidth: 2 }
            );
        }

        frames++;

        const now = performance.now();

        if (now - lastFpsTime >= 1000) {
            fpsText.textContent = Math.round(
                frames * 1000 / (now - lastFpsTime)
            );

            frames = 0;
            lastFpsTime = now;
        }

        setStatus(
            faces.length > 0
                ? "Face detected"
                : "Looking for a face..."
        );
    }

    animationId = requestAnimationFrame(renderFrame);
}

function stopCamera() {
    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    video.pause();
    video.srcObject = null;
    video.classList.remove("active");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    placeholder.hidden = false;
    faceCount.textContent = "0";
    fpsText.textContent = "—";
    landmarkCount.textContent = "—";

    stopButton.disabled = true;
    startButton.disabled = false;

    setStatus("Camera stopped");
}

startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);

window.addEventListener("pagehide", stopCamera);
