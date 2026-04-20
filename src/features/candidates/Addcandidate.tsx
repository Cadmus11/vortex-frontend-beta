import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';


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
  party: z.string().min(2, 'Party must be at least 2 characters'),
  manifesto: z.string().min(10, 'Manifesto must be at least 10 characters'),
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoadingElections, setIsLoadingElections] = useState(true);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'uploading' | 'saving' | 'success'>('idle');

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await fetch(`${API_URL}/elections`, { 
          credentials: "include" 
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
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
      } catch (err) {
        console.error('Failed to fetch elections:', err);
      } finally {
        setIsLoadingElections(false);
      }
    };
    fetchElections();
  }, []);

  const fetchPositions = async (electionId: string) => {
    setIsLoadingPositions(true);
    setPositions([]);
    try {
      const res = await fetch(`${API_URL}/positions?electionId=${electionId}`, { 
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPositions(data.data.map((p: { id?: string; name?: string }) => ({ 
          id: p.id ?? '', 
          name: p.name ?? '' 
        })));
      } else if (Array.isArray(data)) {
        setPositions(data.map((p: { id?: string; name?: string }) => ({ 
          id: p.id ?? '', 
          name: p.name ?? '' 
        })));
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  useEffect(() => {
    if (selectedElection) {
      fetchPositions(selectedElection);
    } else {
      setPositions([]);
      setIsLoadingPositions(false);
    }
  }, [selectedElection]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
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
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitStatus(selectedImageFile ? 'uploading' : 'saving');

    let finalImageUrl: string | null = null;

    try {
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        formData.append('upload_preset', 'vortex_candidates');

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        
        if (!cloudName) {
          console.error('Cloudinary cloud name not configured');
          throw new Error('Cloudinary not configured');
        }

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!cloudRes.ok) {
          const errorText = await cloudRes.text();
          console.error('Cloudinary upload failed:', errorText);
          throw new Error('Cloudinary upload failed');
        }

        const cloudData = await cloudRes.json() as { 
          secure_url?: string; 
          url?: string;
          error?: { message?: string };
        };
        
        if (cloudData.error?.message) {
          throw new Error(cloudData.error.message);
        }
        
        finalImageUrl = cloudData.secure_url || cloudData.url || null;
      }

      setSubmitStatus('saving');

      const payload = {
        name: data.name,
        position: data.position,
        party: data.party,
        manifesto: data.manifesto,
        electionId: data.electionId,
        imageUrl: finalImageUrl,
      };

      const res = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to create candidate', errData);
        throw new Error(errData?.error || errData?.message || 'Failed to create candidate');
      }

      await res.json();
      
      setSubmitStatus('success');
      setImagePreview(null);
      setSelectedImageFile(null);
      reset();
      
      setTimeout(() => setSubmitStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to create candidate:', err);
      alert(err instanceof Error ? err.message : 'Failed to create candidate');
      setSubmitStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add Candidate</h1>
              <p className="text-sm text-muted-foreground">Create a new election candidate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Admin Panel</Badge>
          
          </div>
        </header>

        <Card className="shadow-xl border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
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
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="party">Political Party</Label>
                  <Input 
                    id="party" 
                    placeholder="e.g., Democratic Party" 
                    {...register('party')} 
                  />
                  {errors.party && <p className="text-sm text-red-500">{errors.party.message}</p>}
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
                  {errors.electionId && <p className="text-sm text-red-500">{errors.electionId.message}</p>}
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
                  {errors.position && <p className="text-sm text-red-500">{errors.position.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manifesto">Campaign Manifesto</Label>
                <Textarea 
                  id="manifesto" 
                  placeholder="State your vision and plans if elected..." 
                  className="min-h-30"
                  {...register('manifesto')} 
                />
                {errors.manifesto && <p className="text-sm text-red-500">{errors.manifesto.message}</p>}
              </div>

              <div className="space-y-3">
                <Label>Candidate Photo</Label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md border border-zinc-300 dark:border-zinc-700" />
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isSubmitting || submitStatus !== 'idle'}
              >
                {isSubmitting ? (
                  submitStatus === 'uploading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Image...
                    </>
                  ) : submitStatus === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving to Database...
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Success!
                    </>
                  ) : (
                    'Adding Candidate...'
                  )
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
