"use client";

import React, { useEffect, useState } from 'react';
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
import { Upload, UserPlus } from 'lucide-react';
import { ThemeToggle } from '@/context/ThemeToggler';

// Candidate form schema aligned with server side 'candidates' table
const candidateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  position: z.string().min(1, 'Position is required'),
  manifesto: z.string().min(10, 'Manifesto must be at least 10 characters'),
  electionId: z.string().min(1, 'Election is required'),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

export default function AddCandidate() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [elections, setElections] = useState<Array<{ id: string; title?: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: string; name: string }>>([]);

  // fetch elections for dropdown
  useEffect(() => {
    fetch('/api/elections', { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setElections(data.map((e: any) => ({ id: e.id, title: e.title ?? e.name ?? '' })));
        }
      })
      .catch(() => {});
  }, []);

  // fetch positions for dropdown (global positions)
  useEffect(() => {
    fetch('/api/positions', { credentials: "include" })
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({ id: p.positionId ?? p.id ?? '', name: p.positionName ?? p.name ?? '' }));
          setPositions(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<CandidateFormValues>({
      resolver: zodResolver(candidateSchema),
    });

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
        const cloudData = await cloudRes.json();
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
      manifesto: data.manifesto,
      electionId: data.electionId,
      imageUrl: finalImageUrl ?? null,
    };

    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Failed to create candidate', err);
      alert('Failed to create candidate');
      return;
    }

    const created = await res.json();
    console.log('Candidate created:', created);
    alert('Candidate Added Successfully');
  };

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <span className="flex gap-3 items-center">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h1 className="text-lg font-bold">Add Election Candidate</h1>
            <Badge className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Admin Panel</Badge>
          </span>
          <span className="flex gap-4"><ThemeToggle /><Menu/></span>
        </div>

        <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Candidate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Enter candidate name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Position</Label>
                <Select onValueChange={(value) => setValue('position', value)}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && <p className="text-sm text-red-500">{errors.position.message}</p>}
              </div>

              {/* Manifesto */}
              <div className="space-y-2">
                <Label>Manifesto</Label>
                <Textarea placeholder="Candidate manifesto" {...register('manifesto')} />
                {errors.manifesto && <p className="text-sm text-red-500">{errors.manifesto.message}</p>}
              </div>

              {/* Election */}
              <div className="space-y-2">
                <Label>Election</Label>
                <Select onValueChange={(value) => setValue('electionId', value)}>
                  <SelectTrigger><SelectValue placeholder="Select election" /></SelectTrigger>
                  <SelectContent>
                    {elections.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.title ?? e.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Candidate Image</Label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-md border border-zinc-300 dark:border-zinc-700" />
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Candidate'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
