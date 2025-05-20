import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const RetoFoto = ({ route, navigation }) => {
  const { reto } = route.params;
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Verificar y solicitar permisos necesarios
  const checkPermissions = async (type) => {
    let status;
    if (type === 'camera') {
      status = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      status = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // En Android, solicitamos permiso adicional para metadatos
      if (Platform.OS === 'android') {
        const mediaStatus = await MediaLibrary.requestPermissionsAsync();
        if (mediaStatus.status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a los metadatos para verificar la foto',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    }

    if (status.status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        `Necesitamos acceso a tu ${type === 'camera' ? 'cámara' : 'galería'} para continuar`,
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Obtener fecha de creación de la imagen
  const getImageCreationTime = async (uri) => {
    try {
      // Primero intentamos con MediaLibrary (más preciso)
      const asset = await MediaLibrary.createAssetAsync(uri);
      const metadata = await MediaLibrary.getAssetInfoAsync(asset);
      if (metadata?.creationTime) {
        return new Date(metadata.creationTime);
      }
    } catch (error) {
      console.log('Error con MediaLibrary:', error);
    }

    // Si falla, intentamos con FileSystem (menos preciso)
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo?.modificationTime) {
        return new Date(fileInfo.modificationTime);
      }
    } catch (error) {
      console.log('Error con FileSystem:', error);
    }

    // Si todo falla, usamos la hora actual
    return new Date();
  };

  // Verificar antigüedad de la imagen
  const verifyImageAge = async (uri) => {
    setLoading(true);
    setVerificationStatus(null);
    
    try {
      const creationTime = await getImageCreationTime(uri);
      const currentTime = new Date();
      const diffMinutes = Math.round((currentTime - creationTime) / (1000 * 60));

      if (diffMinutes <= 3) {
        setVerificationStatus('success');
        Alert.alert(
          '✅ Reto completado',
          '¡Felicidades! Has verificado el reto correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setVerificationStatus('error');
        Alert.alert(
          '🕒 Foto muy antigua',
          `La foto fue tomada hace ${diffMinutes} minutos. Debe ser de los últimos 3 minutos.`,
          [{ text: 'Entendido' }]
        );
      }
    } catch (error) {
      console.error('Error al verificar imagen:', error);
      setVerificationStatus('error');
      Alert.alert(
        'Error',
        'No pudimos verificar la foto. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar imagen de galería
  const selectFromGallery = async () => {
    if (!(await checkPermissions('gallery'))) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImage(result.assets[0].uri);
        await verifyImageAge(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con cámara
  const takePhoto = async () => {
    if (!(await checkPermissions('camera'))) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImage(result.assets[0].uri);
        await verifyImageAge(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{reto.nombre}</Text>
      <Text style={styles.subtitle}>Sube una foto como prueba de que completaste el reto</Text>

      {/* Previsualización de imagen */}
      <View style={[
        styles.imageContainer,
        verificationStatus === 'success' && styles.successBorder,
        verificationStatus === 'error' && styles.errorBorder
      ]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Previsualización de la imagen</Text>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.galleryButton]} 
          onPress={selectFromGallery}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Seleccionar de Galería</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.cameraButton]} 
          onPress={takePhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Tomar Foto</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Indicaciones */}
      <Text style={styles.note}>
        La foto debe ser reciente (tomada en los últimos 3 minutos) para ser válida
      </Text>

      {/* Estado de verificación */}
      {verificationStatus === 'success' && (
        <Text style={styles.successText}>✓ Foto verificada correctamente</Text>
      )}
      {verificationStatus === 'error' && (
        <Text style={styles.errorText}>⚠ La foto no cumple los requisitos</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4757',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
  },
  cameraButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  note: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  successBorder: {
    borderColor: '#4CAF50',
  },
  errorBorder: {
    borderColor: '#FF4757',
  },
  successText: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4757',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
});

export default RetoFoto;