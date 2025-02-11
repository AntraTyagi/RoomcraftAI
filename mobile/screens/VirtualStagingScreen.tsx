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
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
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
    const options = {
      mediaType: 'photo',
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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Upload Room Photo</Text>
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
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Detecting furniture...</Text>
          </View>
        )}
      </View>

      {uploadedImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Choose Furniture</Text>
          <FurnitureCollection
            onSelect={setSelectedFurniture}
            selectedItemId={selectedFurniture?.id}
            detectedObjects={detectedObjects}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    width: width * 0.4,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 300,
    marginVertical: 16,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
});
