import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const VideoUploader = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [uploadUrl, setUploadUrl] = useState("");
  const uploadRef = useRef(null);

  const toBase64 = (str) => {
    return btoa(str);
  };

  const formatMetadata = (metadata) => {
    return Object.entries(metadata)
      .map(([key, value]) => `${key} ${value}`)
      .join(",");
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus("idle");
      setProgress(0);
    }
  };

  const startUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    try {
      const metadata = {
        filename: toBase64(file.name),
        authorization: toBase64(
          "panda-b71c9560d252c520191cd3b857017cc0997a6b85359f60f4e1d4979ee2d15594"
        ),
      };

      const uploadUrl = "https://uploader-us01.pandavideo.com.br/files";
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Tus-Resumable": "1.0.0",
          "Upload-Length": file.size,
          "Upload-Metadata": formatMetadata(metadata),
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.log("Erro ao criar upload:", responseText);
        setStatus("error");
        throw new Error(
          `Erro ao criar upload: ${response.status} ${responseText}`
        );
      }

      const location = response.headers.get("Location");
      if (!location) {
        throw new Error(
          "URL de upload não encontrada no cabeçalho da resposta."
        );
      }
      setUploadUrl(location);

      let bytesUploaded = 0;
      const chunkSize = 2 * 1024 * 1024;
      while (bytesUploaded < file.size) {
        const chunk = file.slice(bytesUploaded, bytesUploaded + chunkSize);
        const response = await fetch(location, {
          method: "PATCH",
          headers: {
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": bytesUploaded,
            "Content-Type": "application/offset+octet-stream",
          },
          body: chunk,
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.log("Erro ao enviar chunk:", responseText);
          setStatus("error");
          throw new Error(
            `Erro ao enviar chunk: ${response.status} ${responseText}`
          );
        }

        bytesUploaded += chunk.size;
        const percentage = ((bytesUploaded / file.size) * 100).toFixed(2);
        setProgress(parseFloat(percentage));
      }

      setStatus("success");
      onUploadComplete(location);
    } catch (error) {
      console.error("Erro ao iniciar upload:", error);
      setStatus("error");
    }
  };

  const cancelUpload = () => {
    // não tem como cancelar utilizando fetch.
    setStatus("idle");
    setProgress(0);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <div className="text-2xl font-bold mb-4">Upload de Vídeo</div>

      <div className="space-y-4">
        <Input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={status === "uploading"}
          className="w-full"
        />

        {file && (
          <div className="text-sm text-gray-600">
            Arquivo selecionado: {file.name}
          </div>
        )}

        {status === "uploading" && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-gray-600">
              {progress.toFixed(1)}% enviado
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={startUpload}
            disabled={!file || status === "uploading" || status === "success"}
            className={cn(
              "w-full",
              status === "success" && "bg-green-500 hover:bg-green-600"
            )}
          >
            {status === "uploading" ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-bounce" />
                Enviando...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Concluído!
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Iniciar Upload
              </>
            )}
          </Button>

          {status === "uploading" && (
            <Button
              variant="destructive"
              onClick={cancelUpload}
              className="w-32"
            >
              Cancelar
            </Button>
          )}
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>Erro no upload. Tente novamente.</span>
          </div>
        )}

        {status === "success" && uploadUrl && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="font-semibold text-green-700 mb-2">
              URL do vídeo:
            </div>
            <Input
              value={uploadUrl}
              readOnly
              onClick={(e) => e.target.select()}
              className="bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
