import React, { useState, useRef } from 'react';
import * as tus from 'tus-js-client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const VideoUploader = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadUrl, setUploadUrl] = useState('');
  const uploadRef = useRef(null);

  // Função para codificar em base64
  const toBase64 = (str) => {
    return btoa(str);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setProgress(0);
    }
  };

  const startUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);

    try {
      // Configuração do upload
      const upload = new tus.Upload(file, {
        endpoint: "https://uploader-us01.pandavideo.com.br/files",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          // Substitua YOUR_API_KEY pela sua chave da API do Panda Video
          authorization: toBase64('panda-b71c9560d252c520191cd3b857017cc0997a6b85359f60f4e1d4979ee2d15594'),
        },
        headers: {
          'Tus-Resumable': '1.0.0',
        },
        onError: (error) => {
          console.error('Erro no upload:', error);
          setStatus('error');
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          setProgress(parseFloat(percentage));
        },
        onSuccess: () => {
          console.log('Upload concluído!');
          setStatus('success');
          setUploadUrl(upload.url);
        },
      });

      // Inicia o upload
      upload.start();
      uploadRef.current = upload;

    } catch (error) {
      console.error('Erro ao iniciar upload:', error);
      setStatus('error');
    }
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setStatus('idle');
      setProgress(0);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <div className="text-2xl font-bold mb-4">Upload de Vídeo</div>
      
      <div className="space-y-4">
        <Input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={status === 'uploading'}
          className="w-full"
        />

        {file && (
          <div className="text-sm text-gray-600">
            Arquivo selecionado: {file.name}
          </div>
        )}

        {status === 'uploading' && (
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
            disabled={!file || status === 'uploading' || status === 'success'}
            className={cn(
              "w-full",
              status === 'success' && "bg-green-500 hover:bg-green-600"
            )}
          >
            {status === 'uploading' ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-bounce" />
                Enviando...
              </>
            ) : status === 'success' ? (
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

          {status === 'uploading' && (
            <Button
              variant="destructive"
              onClick={cancelUpload}
              className="w-32"
            >
              Cancelar
            </Button>
          )}
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>Erro no upload. Tente novamente.</span>
          </div>
        )}

        {status === 'success' && uploadUrl && (
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