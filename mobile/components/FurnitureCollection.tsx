import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { FURNITURE_REPOSITORY, FurnitureType } from '../../client/src/constants/furniture-repository';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding
const ITEM_MARGIN = 8;

const FURNITURE_CATEGORIES = [
  { id: "couch" as FurnitureType, label: "Couches" },
  { id: "bed" as FurnitureType, label: "Beds" },
  { id: "work_table" as FurnitureType, label: "Work Tables" },
  { id: "center_table" as FurnitureType, label: "Center Tables" },
];

interface FurnitureCollectionProps {
  onSelect: (item: any) => void;
  selectedItemId?: string;
  detectedObjects?: Array<{
    label: string;
    confidence: number;
    box: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>;
}

export default function FurnitureCollection({
  onSelect,
  selectedItemId,
  detectedObjects = [],
}: FurnitureCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureType>("couch");

  const getMatchingObjects = (category: string) => {
    return detectedObjects.filter(obj => {
      const label = obj.label.toLowerCase();
      switch (category) {
        case 'couch':
          return label.includes('sofa') || label.includes('couch');
        case 'bed':
          return label.includes('bed');
        case 'work_table':
          return label.includes('desk') || label.includes('work table');
        case 'center_table':
          return label.includes('coffee table') || label.includes('center table');
        default:
          return false;
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {FURNITURE_CATEGORIES.map(category => {
          const matchingCount = getMatchingObjects(category.id).length;
          const isSelected = category.id === selectedCategory;

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryText,
                isSelected && styles.selectedCategoryText,
              ]}>
                {category.label}
                {matchingCount > 0 ? ` (${matchingCount})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView 
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {FURNITURE_REPOSITORY[selectedCategory].map((item) => {
            const matchingObjects = getMatchingObjects(selectedCategory);
            const isSelected = selectedItemId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                {matchingObjects.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Detected</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedCategory: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  itemsContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  itemCard: {
    width: ITEM_WIDTH,
    marginHorizontal: ITEM_MARGIN,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  itemImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.75,
    backgroundColor: '#f4f4f5',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#18181b',
  },
  itemDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});