import React, { useState, useRef } from 'react';
import { Occurrence, Area } from '../types';

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
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
    } catch (error) {
      console.error("Erro ao acessar o microfone:", error);
      alert("Não foi possível acessar o microfone.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      // Usando a API da Gemini diretamente, sem o SDK problemático
      const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY; // Acessando a chave do .env
      
      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: audioBlob.type,
                    data: base64Audio,
                  },
                },
                {
                  text: "Transcreva este áudio em português do Brasil, apenas o texto falado.",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const transcribedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setDescription(prev => prev ? `${prev}\n\n[Transcrição]: ${transcribedText}` : `[Transcrição]: ${transcribedText}`);

    } catch (error) {
      console.error("Erro na transcrição:", error);
      alert("Erro ao transcrever áudio. Verifique sua chave Gemini e conexão.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    let finalAudioUrl = null;
    if (audioBlob) {
        const base64Audio = await blobToBase64(audioBlob);
        finalAudioUrl = `data:${audioBlob.type};base64,${base64Audio}`;
    }
    await onAddOccurrence({ title, description, location, area, photos, audioUrl: finalAudioUrl || undefined, isUrgent });
    resetForm();
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-[#003366] mb-6 text-center">Nova Tarefa</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between bg-red-50 p-3 rounded-md border border-red-200">
            <span className="text-red-700 font-bold flex items-center gap-2">⚠️ Urgente</span>
            <button type="button" onClick={() => setIsUrgent(!isUrgent)} className={`${isUrgent ? 'bg-red-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors`}>
                <span className={`${isUrgent ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white transition duration-200`} />
            </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Título*</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Localização*</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Área Responsável*</label>
          <select value={area} onChange={(e) => setArea(e.target.value as Area)} className="mt-1 block w-full px-3 py-2 border rounded-md">
            {(Object.values(Area) as string[]).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição*</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border rounded-md" required></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Áudio (opcional)</label>
          <div className="mt-2 p-4 border-2 border-dashed rounded-md text-center">
            {!isRecording && !audioURL && <button type="button" onClick={startRecording} className="bg-[#003366] text-white px-4 py-2 rounded-md">Gravar</button>}
            {isRecording && <button type="button" onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded-md animate-pulse">Parar</button>}
            {audioURL && !isRecording && (
              <div className="space-y-2">
                <audio src={audioURL} controls className="w-full" />
                <button type="button" onClick={handleTranscribe} disabled={isTranscribing} className="text-sm bg-[#d4af37] text-white px-3 py-1 rounded">
                  {isTranscribing ? 'Transcrevendo...' : 'Transcrever'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fotos (máx 5)</label>
          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="mt-1 block w-full text-sm" />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {photos.map((p, i) => (
                <div key={i} className="relative">
                    <img src={p} className="h-20 w-20 object-cover rounded" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs">x</button>
                </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-[#003366] text-white py-3 rounded-md font-bold">
            {isSubmitting ? 'Enviando...' : 'Relatar Tarefa'}
        </button>
      </form>
    </div>
  );
};

export default OccurrenceForm;
