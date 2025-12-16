
import React, { useState, useRef } from 'react';
import { Occurrence, Area } from '../types';
import { GoogleGenAI } from '@google/genai';

interface OccurrenceFormProps {
  onAddOccurrence: (occurrence: Omit<Occurrence, 'id' | 'timestamp' | 'status' | 'uniqueId' | 'createdBy' | 'creatorName' | 'updatesLog'>) => Promise<void>;
}

const OccurrenceForm: React.FC<OccurrenceFormProps> = ({ onAddOccurrence }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState<Area>(Area.Manutencao);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | undefined>(undefined);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setArea(Area.Manutencao);
    setPhotos([]);
    setAudioURL(undefined);
    setAudioBlob(null);
    setIsRecording(false);
    setIsTranscribing(false);
    setIsSubmitting(false);
    setIsUrgent(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (photos.length + files.length > 5) {
        alert("Você pode enviar no máximo 5 fotos.");
        return;
      }
      const newPhotos: string[] = [];

      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPhotos.push(reader.result as string);
          if (newPhotos.length === files.length) {
            setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Unified Photo Capture (File Upload or Camera via Native OS)
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      handlePhotoUpload(e);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setAudioBlob(null);
      setAudioURL(undefined);
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Erro ao acessar o microfone:", error);
      alert("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRemoveAudio = () => {
    setAudioURL(undefined);
    setAudioBlob(null);
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      alert("Nenhum áudio gravado para transcrever.");
      return;
    }
    setIsTranscribing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Audio = await blobToBase64(audioBlob);
      const audioPart = {
        inlineData: {
          mimeType: audioBlob.type,
          data: base64Audio,
        },
      };
      const textPart = { text: "Transcreva este áudio em português do Brasil. O áudio é um relato de uma tarefa em um shopping center." };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
      });

      setDescription(prev => prev ? `${prev}\n\n[Transcrição do Áudio]:\n${response.text}` : `[Transcrição do Áudio]:\n${response.text}`);

    } catch (error) {
      console.error("Erro na transcrição:", error);
      alert("Ocorreu um erro ao tentar transcrever o áudio.");
    } finally {
      setIsTranscribing(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) {
      alert("Por favor, preencha todos os campos obrigatórios (Título, Localização, Descrição).");
      return;
    }
    setIsSubmitting(true);

    // AUDIO FIX: Convert Blob to Base64 Data URI to ensure persistence across devices
    let finalAudioUrl = null;
    if (audioBlob) {
        try {
            const base64Audio = await blobToBase64(audioBlob);
            finalAudioUrl = `data:${audioBlob.type};base64,${base64Audio}`;
        } catch (error) {
            console.error("Failed to process audio", error);
            alert("Erro ao processar áudio. A tarefa será salva sem o áudio.");
        }
    }

    // Pass the Base64 string instead of the Blob URL
    await onAddOccurrence({ 
        title, 
        description, 
        location, 
        area, 
        photos, 
        audioUrl: finalAudioUrl || undefined, 
        isUrgent 
    });
    
    resetForm();
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-trimais-blue mb-6 text-center">Nova Tarefa</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Urgent Toggle */}
        <div className="flex items-center justify-between bg-red-50 p-3 rounded-md border border-red-200">
            <span className="text-red-700 font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Alta Prioridade / Urgente
            </span>
            <button
                type="button"
                onClick={() => setIsUrgent(!isUrgent)}
                className={`${isUrgent ? 'bg-red-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
                <span className={`${isUrgent ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
            </button>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título*</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" required />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Localização*</label>
          <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" placeholder="Ex: Corredor A, Praça de Alimentação" required />
        </div>
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">Área Responsável*</label>
          <select id="area" value={area} onChange={(e) => setArea(e.target.value as Area)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue">
            {Object.values(Area).map(areaOption => (
              <option key={areaOption} value={areaOption}>{areaOption}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição*</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" required ></textarea>
        </div>

        {/* Audio Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Áudio (opcional)</label>
          <div className="mt-2 p-4 border-2 border-gray-300 border-dashed rounded-md text-center">
            {!isRecording && !audioURL && (
              <button type="button" onClick={startRecording} className="mx-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-trimais-blue rounded-md shadow-sm hover:bg-blue-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V14a1 1 0 00-1-1H4a1 1 0 00-1 1v.93a7.001 7.001 0 005.93 6.918 1 1 0 00.14.002 1 1 0 00.93-.998V15a1 1 0 00-1-1h-1v-.07A5.002 5.002 0 0111 14.93z" clipRule="evenodd" /></svg>
                Gravar Áudio
              </button>
            )}
            {isRecording && (
              <button type="button" onClick={stopRecording} className="mx-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 animate-pulse">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                Parar Gravação
              </button>
            )}
            {audioURL && !isRecording && (
              <div className="space-y-3">
                <audio src={audioURL} controls className="w-full" />
                <div className="flex flex-wrap justify-center gap-2">
                   <button type="button" onClick={handleTranscribe} disabled={isTranscribing} className="px-3 py-1.5 text-xs font-medium text-white bg-trimais-gold rounded-md shadow-sm hover:bg-yellow-600 disabled:bg-gray-400">
                    {isTranscribing ? 'Transcrevendo...' : 'Transcrever Áudio'}
                  </button>
                  <button type="button" onClick={handleRemoveAudio} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                    Remover Áudio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Photo Section (NATIVE CAMERA FIX) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Fotos (opcional, máx 5)</label>
          <div className="mt-2 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-trimais-blue hover:text-trimais-gold focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-trimais-blue">
                    <span>Carregar da Galeria</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handlePhotoUpload} disabled={photos.length >= 5} />
                </label>
                <p className="text-gray-500">ou</p>
                
                {/* NATIVE CAMERA TRIGGER */}
                <label htmlFor="camera-upload" className="cursor-pointer font-medium text-trimais-blue hover:text-trimais-gold disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                     Tirar Foto
                     <input id="camera-upload" type="file" capture="environment" accept="image/*" className="sr-only" onChange={handleNativeCameraCapture} disabled={photos.length >= 5} />
                </label>

              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
            </div>
          </div>
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img src={photo} alt={`preview ${index}`} className="h-24 w-full object-cover rounded-md" />
                  <button type="button" onClick={() => removePhoto(index)} className="absolute top-0 right-0 m-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 text-base font-medium text-white bg-trimais-blue border border-transparent rounded-md shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trimais-blue disabled:bg-gray-400">
            {isSubmitting ? 'Enviando...' : 'Relatar Tarefa'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OccurrenceForm;
