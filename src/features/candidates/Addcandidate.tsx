import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, UserPlus, Shield, Loader2 } from 'lucide-react';

import { API_URL } from '../../config/api';

const candidateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  position: z.string().min(1, 'Position is required'),
  party: z.string().min(1, 'Party is required'),
  manifesto: z.string().optional(),
  electionId: z.string().min(1, 'Election is required'),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface Election {
  id: string;
  title?: string;
}

interface Position {
  id: string;
  name: string;
}

export default function AddCandidate() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoadingElections, setIsLoadingElections] = useState(true);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    fetch(`${API_URL}/elections`, { credentials: "include", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setElections(data.data.map((e: { id: string; title?: string; name?: string }) => ({ 
            id: e.id, 
            title: e.title ?? e.name ?? '' 
          })));
        } else if (Array.isArray(data)) {
          setElections(data.map((e: { id: string; title?: string; name?: string }) => ({ 
            id: e.id, 
            title: e.title ?? e.name ?? '' 
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingElections(false));
  }, [accessToken]);

  useEffect(() => {
    fetch(`${API_URL}/positions`, { credentials: "include", headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setPositions(data.data.map((p: { id?: string; positionId?: string; name?: string; positionName?: string }) => ({ 
            id: p.id ?? p.positionId ?? '', 
            name: p.name ?? p.positionName ?? '' 
          })));
        } else if (Array.isArray(data)) {
          setPositions(data.map((p: { id?: string; positionId?: string; name?: string; positionName?: string }) => ({ 
            id: p.id ?? p.positionId ?? '', 
            name: p.name ?? p.positionName ?? '' 
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingPositions(false));
  }, [accessToken]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<CandidateFormValues>({
      resolver: zodResolver(candidateSchema),
      defaultValues: {
        name: '',
        position: '',
        party: '',
        manifesto: '',
        electionId: '',
      },
    });

  const selectedPosition = watch('position');
  const selectedElection = watch('electionId');

  const onSubmit = async (data: CandidateFormValues) => {
    setSubmitStatus('idle');
    setErrorMessage('');

    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) {
      setSubmitStatus('error');
      setErrorMessage('Please log in to add a candidate');
      return;
    }

    let finalImageUrl: string | null = null;

    if (selectedImageFile) {
      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('upload_preset', 'vortex_candidates');

      try {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        
        if (cloudName) {
          const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
          );

          if (cloudRes.ok) {
            const cloudData = await cloudRes.json() as { secure_url?: string; url?: string };
            finalImageUrl = cloudData.secure_url || cloudData.url || null;
          }
        }
      } catch (err) {
        console.warn('Image upload failed:', err);
      }
    }

    const payload = {
      name: data.name,
      position: data.position,
      party: data.party,
      manifesto: data.manifesto || '',
      electionId: data.electionId,
      imageUrl: finalImageUrl,
    };

    const res = await fetch(`${API_URL}/candidates`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      setSubmitStatus('error');
      setErrorMessage(errData?.error || errData?.message || 'Failed to create candidate');
      return;
    }

    setSubmitStatus('success');
    setImagePreview(null);
    setSelectedImageFile(null);
    reset();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add Candidate</h1>
              <p className="text-sm text-muted-foreground">Create a new election candidate</p>
            </div>
          </div>
          <Badge variant="secondary">Admin Panel</Badge>
        </header>

        {submitStatus === 'error' && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
            {errorMessage}
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-success">
            Candidate added successfully!
          </div>
        )}

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter candidate full name" 
                    {...register('name')} 
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="party">Political Party</Label>
                  <Input 
                    id="party" 
                    placeholder="e.g., Democratic Party" 
                    {...register('party')} 
                  />
                  {errors.party && <p className="text-sm text-destructive">{errors.party.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Election</Label>
                  <Select onValueChange={(value) => setValue('electionId', value)} value={selectedElection}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingElections ? "Loading..." : "Select election"} />
                    </SelectTrigger>
                    <SelectContent>
                      {elections.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.electionId && <p className="text-sm text-destructive">{errors.electionId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select onValueChange={(value) => setValue('position', value)} value={selectedPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingPositions ? "Loading..." : "Select position"} />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manifesto">Campaign Manifesto (Optional)</Label>
                <Textarea 
                  id="manifesto" 
                  placeholder="State your vision and plans if elected..." 
                  className="min-h-24"
                  {...register('manifesto')} 
                />
              </div>

              <div className="space-y-3">
                <Label>Candidate Photo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setSelectedImageFile(null); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Candidate...
                  </>
                ) : (
                  'Add Candidate'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
