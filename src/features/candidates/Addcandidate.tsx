import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Menu from '@/components/custom/Menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, UserPlus, Shield } from 'lucide-react';
import { ThemeToggle } from '@/context/ThemeToggler';
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

  useEffect(() => {
    fetch(`${API_URL}/elections`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setElections(data.map((e: { id: string; title?: string; name?: string }) => ({ 
            id: e.id, 
            title: e.title ?? e.name ?? '' 
          })));
        } else if (data.data && Array.isArray(data.data)) {
          setElections(data.data.map((e: { id: string; title?: string; name?: string }) => ({ 
            id: e.id, 
            title: e.title ?? e.name ?? '' 
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingElections(false));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/positions`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPositions(data.map((p: { positionId?: string; id?: string; positionName?: string; name?: string }) => ({ 
            id: p.positionId ?? p.id ?? '', 
            name: p.positionName ?? p.name ?? '' 
          })));
        } else if (data.data && Array.isArray(data.data)) {
          setPositions(data.data.map((p: { positionId?: string; id?: string; positionName?: string; name?: string }) => ({ 
            id: p.positionId ?? p.id ?? '', 
            name: p.positionName ?? p.name ?? '' 
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingPositions(false));
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
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
    let finalImageUrl = imagePreview;

    if (selectedImageFile) {
      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('upload_preset', 'vortex_candidates');

      try {
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        const cloudData = await cloudRes.json() as { secure_url?: string };
        if (cloudData.secure_url) {
          finalImageUrl = cloudData.secure_url;
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    const payload = {
      name: data.name,
      position: data.position,
      party: data.party,
      manifesto: data.manifesto,
      electionId: data.electionId,
      imageUrl: finalImageUrl ?? null,
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
      alert('Failed to create candidate');
      return;
    }

    const created = await res.json();
    console.log('Candidate created:', created);
    alert('Candidate Added Successfully');
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
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
            <ThemeToggle />
            <Menu />
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
                  className="min-h-[120px]"
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Candidate...' : 'Add Candidate'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
