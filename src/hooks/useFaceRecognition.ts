import { useState, useRef, useCallback } from 'react';

interface FaceRecognitionState {
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

interface FaceMatchResult {
  descriptor: number[];
  landmarks: Array<{ x: number; y: number }>;
}

const MODELS_PATH = '/models';
const TINY_FACE_OPTIONS = { inputSize: 416, scoreThreshold: 0.5 } as const;
const MATCH_THRESHOLD = 0.6;

export function useFaceRecognition() {
  const [state, setState] = useState<FaceRecognitionState>({
    loaded: false,
    loading: false,
    error: null,
  });
  
  const modelsLoadedRef = useRef(false);
  const faceApiRef = useRef<typeof import('face-api.js') | null>(null);

  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const faceApi = await import('face-api.js');
      faceApiRef.current = faceApi;
      
      await faceApi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH);
      await faceApi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH);
      await faceApi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH);

      modelsLoadedRef.current = true;
      setState(prev => ({ ...prev, loaded: true, loading: false }));
    } catch (err) {
      console.error('Failed to load face-api models:', err);
      setState(prev => ({ 
        ...prev, 
        loaded: false, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Failed to load models' 
      }));
    }
  }, []);

  const detectFace = useCallback(async (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<FaceMatchResult | null> => {
    if (!modelsLoadedRef.current || !faceApiRef.current) {
      throw new Error('Models not loaded');
    }

    const faceApi = faceApiRef.current;
    
    const detections = await faceApi.detectAllFaces(
      input, 
      new faceApi.TinyFaceDetectorOptions(TINY_FACE_OPTIONS)
    );

    if (!detections || detections.length === 0) {
      return null;
    }

    const detection = detections[0];
    const descriptor = Array.from(detection.descriptor);

    const landmarks = await faceApi.detectFaceLandmarks(input, detection);

    return {
      descriptor,
      landmarks: landmarks?.positions?.map(p => ({ x: p.x, y: p.y })) || [],
    };
  }, []);

  const getDescriptor = useCallback(async (
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<number[] | null> => {
    if (!modelsLoadedRef.current || !faceApiRef.current) {
      throw new Error('Models not loaded');
    }

    const faceApi = faceApiRef.current;
    
    const detections = await faceApi.detectAllFaces(
      input,
      new faceApi.TinyFaceDetectorOptions(TINY_FACE_OPTIONS)
    );

    if (!detections || detections.length === 0) {
      return null;
    }

    return Array.from(detections[0].descriptor);
  }, []);

  const compareDescriptors = useCallback((
    descriptor1: number[], 
    descriptor2: number[]
  ): boolean => {
    if (!faceApiRef.current) return false;
    
    const d1 = new Float32Array(descriptor1);
    const d2 = new Float32Array(descriptor2);
    
    const distance = faceApiRef.current.euclideanDistance(d1, d2);
    return distance < MATCH_THRESHOLD;
  }, []);

  const computeSimilarity = useCallback((
    descriptor1: number[], 
    descriptor2: number[]
  ): number => {
    if (!faceApiRef.current || descriptor1.length !== descriptor2.length) return 0;
    
    const d1 = new Float32Array(descriptor1);
    const d2 = new Float32Array(descriptor2);
    
    const distance = faceApiRef.current.euclideanDistance(d1, d2);
    const similarity = Math.max(0, 1 - distance);
    
    return Math.round(similarity * 100) / 100;
  }, []);

  return {
    ...state,
    loadModels,
    detectFace,
    getDescriptor,
    compareDescriptors,
    computeSimilarity,
  };
}

export default useFaceRecognition;