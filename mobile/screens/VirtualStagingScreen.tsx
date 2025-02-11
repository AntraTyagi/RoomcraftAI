import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useMutation } from '@tanstack/react-query';
import FurnitureCollection from '../components/FurnitureCollection';
import type { FurnitureItem } from '../../client/src/components/furniture-collection';

const { width } = Dimensions.get('window');

export default function VirtualStagingScreen() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<Array<{
    label: string;
    confidence: number;
    box: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>>([]);

  const detectObjectsMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const response = await fetch('YOUR_API_ENDPOINT/detect-objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUri,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to detect objects');
      }

      const data = await response.json();
      return data.objects;
    },
    onSuccess: (objects) => {
      setDetectedObjects(objects);
    },
  });

  const handleImagePick = async (useCamera: boolean) => {
    const options: any = {
      mediaType: 'photo' as const,
      includeBase64: true,
    };

    try {
      const result = useCamera 
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (uri) {
          setUploadedImage(uri);
          detectObjectsMutation.mutate(uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Room Photo</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleImagePick(false)}
            >
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleImagePick(true)}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {uploadedImage && (
            <Image
              source={{ uri: uploadedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          {detectObjectsMutation.isPending && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Detecting furniture...</Text>
            </View>
          )}
        </View>

        {uploadedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Furniture</Text>
            <FurnitureCollection
              onSelect={setSelectedFurniture}
              selectedItemId={selectedFurniture?.id}
              detectedObjects={detectedObjects}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  section: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#18181b',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: (width - 64) / 2.2,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: width * 0.75,
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },
});