import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import RetoFoto from './RetoFoto';

const retosData = [
  {
    id: '1',
    nombre: 'Tómate un karpil',
    imagen: require('../../assets/img/camera.png'),
  },
  {
    id: '2',
    nombre: 'Visita la plaza Sucre',
    imagen: require('../../assets/img/sucre.jpg'),
  },
  {
    id: '3',
    nombre: 'Tómate un helado',
    imagen: require('../../assets/img/helado.jpeg'),
  },
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING = 12;

const HomeScreen = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

const handleCardPress = (item) => {
  navigation.navigate('RetoFoto', { reto: item });
};



  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const height = scrollX.interpolate({
      inputRange,
      outputRange: [240, 280, 240],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 1, 0.75],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.9}
        onPress={() => handleCardPress(item)}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Animated.Image
            source={item.imagen}
            style={[styles.imagen, { height }]}
            resizeMode="cover"
          />
          <View style={styles.infoContainer}>
            <Text style={styles.nombre}>{item.nombre}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retos</Text>

      <Animated.FlatList
        ref={flatListRef}
        data={retosData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      <View style={styles.indicatorContainer}>
        {retosData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              activeIndex === index ? styles.activeIndicator : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 20,
    color: '#333',
  },
  flatListContent: {
    paddingLeft: width * 0.1,
    paddingRight: width * 0.1,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FF4757',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  imagen: {
    width: '100%',
    height: 280,
  },
  infoContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  indicator: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 71, 87, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FF4757',
    width: 18,
  },
});

export default HomeScreen;
