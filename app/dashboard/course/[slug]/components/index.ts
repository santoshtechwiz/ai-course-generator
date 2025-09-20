import { RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader } from "@/components/loader";
import { VideoIcon } from 'lucide-react';
import { useVideoProcessing } from '@/app/dashboard/create/hooks/useVideoProcessing';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export * from './VideoGenerationSection';