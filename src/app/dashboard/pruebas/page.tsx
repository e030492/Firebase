
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useData } from '@/hooks/use-data-provider';
import { MediaFile } from '@/lib/services';
import { Upload, FileVideo, FileImage, Trash2, Expand, Loader2 } from 'lucide-react';

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function PruebasPage() {
    const { subscribeToMediaLibrary, uploadFile, deleteMediaFile } = useData();
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
    const [mediaToDelete, setMediaToDelete] = useState<MediaFile | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToMediaLibrary((data) => {
            setMediaLibrary(data);
            setLoadingLibrary(false);
        });
        return () => unsubscribe();
    }, [subscribeToMediaLibrary]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);

        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        let uploadedSize = 0;

        for (const file of files) {
            try {
                await uploadFile(file);
                uploadedSize += file.size;
                setUploadProgress((uploadedSize / totalSize) * 100);
            } catch (error) {
                console.error("Error uploading file:", error);
                alert(`Error al subir el archivo: ${file.name}`);
                break;
            }
        }
        
        setIsUploading(false);
        setUploadProgress(null);
        setFiles([]);
    };
    
    const handleDelete = async () => {
        if (!mediaToDelete) return;
        try {
            await deleteMediaFile(mediaToDelete);
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Error al eliminar el archivo.");
        } finally {
            setMediaToDelete(null);
        }
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-2">
                <h1 className="font-headline text-3xl font-bold">Módulo de Pruebas</h1>
                <p className="text-muted-foreground">
                    Área aislada para probar la carga de archivos multimedia de alta calidad a Firebase Storage.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Carga de Archivos</CardTitle>
                    <CardDescription>Seleccione múltiples imágenes o videos para subirlos al almacenamiento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="file-upload">Archivos</Label>
                        <Input
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                            accept="image/*,video/*"
                        />
                    </div>
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Archivos seleccionados:</p>
                            <ul className="text-sm text-muted-foreground list-disc pl-5">
                                {files.map((file, index) => <li key={index}>{file.name} ({formatBytes(file.size)})</li>)}
                            </ul>
                        </div>
                    )}
                    {isUploading && uploadProgress !== null && (
                         <Progress value={uploadProgress} className="w-full" />
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? `Subiendo... ${Math.round(uploadProgress ?? 0)}%` : `Subir ${files.length} Archivos`}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Directorio de Medios</CardTitle>
                    <CardDescription>Archivos subidos recientemente. Haga clic para ver.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingLibrary ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                           {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                        </div>
                    ) : mediaLibrary.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                            <FileImage className="h-12 w-12 mb-4" />
                            <p>No hay archivos en el directorio.</p>
                            <p className="text-sm">Sube algunos archivos para verlos aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {mediaLibrary.map(media => (
                                <div key={media.id} className="group relative aspect-square">
                                    <button onClick={() => setSelectedMedia(media)} className="w-full h-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring">
                                        {media.type.startsWith('image/') ? (
                                            <Image src={media.url} alt={media.name} layout="fill" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                                                <FileVideo className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Expand className="h-8 w-8 text-white" />
                                        </div>
                                    </button>
                                     <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setMediaToDelete(media)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white">
                                        <p className="text-xs font-semibold truncate">{media.name}</p>
                                        <p className="text-xs opacity-80">{formatBytes(media.size)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="truncate">{selectedMedia?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center">
                    {selectedMedia?.type.startsWith('image/') ? (
                        <Image src={selectedMedia.url} alt={selectedMedia.name} width={1200} height={800} className="max-w-full max-h-[80vh] object-contain"/>
                    ) : (
                        <video src={selectedMedia?.url} controls autoPlay className="max-w-full max-h-[80vh]"/>
                    )}
                    </div>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este archivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El archivo "{mediaToDelete?.name}" será eliminado permanentemente de Firebase Storage.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
