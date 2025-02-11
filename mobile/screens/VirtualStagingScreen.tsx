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
  StatusBar,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import FurnitureCollection from '../components/FurnitureCollection';
import type { FurnitureItem } from '../../client/src/components/furniture-collection';

const { width } = Dimensions.get('window');

export default function VirtualStagingScreen() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
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
    <SafeAreaContext style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f5" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Room Photo</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.galleryButton]}
              onPress={() => handleImagePick(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cameraButton]}
              onPress={() => handleImagePick(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {uploadedImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: uploadedImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
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
    </SafeAreaContext>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButton: {
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  cameraButton: {
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
  },
  previewImage: {
    width: '100%',
    height: width * 0.75,
    backgroundColor: '#f4f4f5',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});