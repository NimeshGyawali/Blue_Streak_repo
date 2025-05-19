'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';

const photoUploadSchema = z.object({
  // For client-side validation, FileList is tricky with Zod.
  // Usually, you'd handle file validation on the server or with custom client logic.
  // For now, we'll just ensure a file is conceptually selected.
  photo: z.any().refine(value => value && value.length > 0, { message: 'Please select a photo to upload.' }),
  caption: z.string().max(200, { message: 'Caption must be 200 characters or less.' }).optional(),
});

interface PhotoUploadFormProps {
  rideId: string;
}

export function PhotoUploadForm({ rideId }: PhotoUploadFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof photoUploadSchema>>({
    resolver: zodResolver(photoUploadSchema),
    defaultValues: {
      caption: '',
    },
  });

  function onSubmit(values: z.infer<typeof photoUploadSchema>) {
    console.log('Uploading photo for ride:', rideId, values);
    // Here you would typically use FormData to send the file to your backend.
    // const formData = new FormData();
    // formData.append('photo', values.photo[0]);
    // if (values.caption) formData.append('caption', values.caption);
    // formData.append('rideId', rideId);
    // ... API call ...

    toast({
      title: 'Photo Submitted',
      description: `Caption: ${values.caption || 'N/A'}. Implement actual upload.`,
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border bg-card rounded-lg shadow-sm">
        <FormField
          control={form.control}
          name="photo"
          render={({ field: { onChange, value, ...rest } }) => ( // Manually handle onChange for file input
            <FormItem>
              <FormLabel>Select Photo</FormLabel>
              <FormControl>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <Input 
                          id="dropzone-file" 
                          type="file" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/gif"
                          onChange={(e) => onChange(e.target.files)} // Pass FileList to react-hook-form
                          {...rest}
                        />
                    </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caption (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your photo..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          <UploadCloud size={18} className="mr-2" /> Upload Photo
        </Button>
      </form>
    </Form>
  );
}
