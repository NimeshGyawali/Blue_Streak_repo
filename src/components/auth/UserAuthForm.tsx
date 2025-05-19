'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  city: z.string().min(1, { message: 'City/Region is required.' }),
  bikeModel: z.string().min(1, { message: 'Yamaha Bike Model is required.' }),
  vin: z.string().min(17, { message: 'VIN must be 17 characters.' }).max(17),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserAuthFormProps = {
  mode: 'login' | 'signup';
};

export function UserAuthForm({ mode }: UserAuthFormProps) {
  const { toast } = useToast();
  const schema = mode === 'login' ? loginSchema : signupSchema;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'login' ? { email: '', password: '' } : {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      city: '',
      bikeModel: '',
      vin: '',
    },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    // In a real app, you'd handle API calls here.
    console.log(values);
    toast({
      title: mode === 'login' ? 'Login Submitted' : 'Signup Submitted',
      description: 'Form data logged to console. Implement actual auth.',
    });
    // form.reset(); // Optionally reset form
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}</CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Log in to access your Yamaha Blue Streaks profile.' : 'Join the Yamaha Blue Streaks community.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === 'signup' && (
              <>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Region</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Los Angeles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bikeModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yamaha Bike Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., YZF-R1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN (Vehicle Identification Number)</FormLabel>
                      <FormControl>
                        <Input placeholder="17-character VIN" {...field} />
                      </FormControl>
                      <FormDescription>This helps us verify your Yamaha ownership.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </Button>
            {mode === 'login' ? (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button variant="link" asChild className="p-0 h-auto">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                 <Button variant="link" asChild className="p-0 h-auto">
                  <Link href="/auth/login">Login</Link>
                </Button>
              </p>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
