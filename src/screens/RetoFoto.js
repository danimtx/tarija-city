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
import RoboflowService from '../services/RoboflowService'; // Ajusta la ruta según tu estructura

const RetoFoto = ({ route, navigation }) => {
  const { reto } = route.params;
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);

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
    let imageDate = null;
    
    // Función para validar que la fecha sea razonable (no del futuro ni demasiado antigua)
    const isValidDate = (date) => {
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      
      // La fecha no debe ser del futuro ni anterior a un año atrás
      return date <= now && date >= oneYearAgo;
    };

    try {
      // Primero intentamos con MediaLibrary (más preciso)
      const asset = await MediaLibrary.createAssetAsync(uri);
      const metadata = await MediaLibrary.getAssetInfoAsync(asset);
      if (metadata?.creationTime) {
        const date = new Date(metadata.creationTime);
        console.log('Fecha de MediaLibrary:', date);
        if (isValidDate(date)) {
          return date;
        } else {
          console.log('Fecha de MediaLibrary inválida, fuera de rango razonable');
        }
      }
    } catch (error) {
      console.log('Error con MediaLibrary:', error);
    }

    // Si falla, intentamos con FileSystem (menos preciso)
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: false });
      if (fileInfo?.modificationTime) {
        const date = new Date(fileInfo.modificationTime);
        console.log('Fecha de FileSystem:', date);
        
        // Verificar que la fecha no sea de 1970 (timestamp inválido)
        const year = date.getFullYear();
        if (year > 2000 && isValidDate(date)) {
          return date;
        } else {
          console.log('Fecha de FileSystem inválida:', year < 2000 ? 'Anterior al 2000' : 'Fuera de rango razonable');
        }
      }
    } catch (error) {
      console.log('Error con FileSystem:', error);
    }

    // Si todo falla o las fechas son inválidas, usamos la hora actual
    console.log('Usando fecha actual como fallback');
    return new Date();
  };

  // Verificar antigüedad de la imagen Y detección de objetos
  const verifyImageAndDetection = async (uri) => {
    setLoading(true);
    setVerificationStatus(null);
    setDetectionResult(null);
    
    try {
      // 1. Verificar antigüedad de la imagen
      const creationTime = await getImageCreationTime(uri);
      const currentTime = new Date();
      const diffMinutes = Math.round((currentTime - creationTime) / (1000 * 60));

      console.log('Diferencia en minutos:', diffMinutes);

      // Aumentamos el límite a 30 minutos para ser más permisivos
      if (diffMinutes > 30) {
        setVerificationStatus('error');
        Alert.alert(
          '🕒 Foto muy antigua',
          `La foto fue tomada hace ${diffMinutes} minutos. Debe ser de los últimos 30 minutos.`,
          [{ text: 'Entendido' }]
        );
        return;
      }

      // 2. Verificar detección de objetos con Roboflow
      const detectionResult = await RoboflowService.verifyChallenge(
        uri,
        reto.expectedObjects || [] // Array de objetos esperados del reto
      );

      setDetectionResult(detectionResult);

      if (detectionResult.verified) {
        setVerificationStatus('success');
        Alert.alert(
          '✅ Reto completado',
          detectionResult.message,
          [
            { 
              text: 'Ver detalles', 
              onPress: () => showDetectionDetails(detectionResult) 
            },
            { 
              text: 'Continuar', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        setVerificationStatus('error');
        Alert.alert(
          '❌ Reto no completado',
          detectionResult.message,
          [
            { 
              text: 'Ver detalles', 
              onPress: () => showDetectionDetails(detectionResult) 
            },
            { 
              text: 'Intentar de nuevo', 
              style: 'default' 
            }
          ]
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

  // Mostrar detalles de la detección
  const showDetectionDetails = (result) => {
    if (!result.details || !result.details.success) {
      Alert.alert('Sin detalles', 'No hay información adicional disponible');
      return;
    }

    const stats = RoboflowService.getDetectionStats(result.details);
    
    let message = `Detecciones encontradas: ${stats.totalDetections}\n`;
    message += `Detecciones válidas: ${stats.validDetections}\n`;
    
    if (stats.classes.length > 0) {
      message += `Objetos detectados: ${stats.classes.join(', ')}\n`;
      message += `Confianza promedio: ${(stats.averageConfidence * 100).toFixed(1)}%`;
    }

    Alert.alert('Detalles de detección', message, [{ text: 'OK' }]);
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
        await verifyImageAndDetection(result.assets[0].uri);
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
        await verifyImageAndDetection(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{reto.nombre}</Text>
      <Text style={styles.subtitle}>
        Sube una foto como prueba de que completaste el reto
      </Text>

      {/* Mostrar objetos esperados si los hay */}
      {reto.expectedObjects && reto.expectedObjects.length > 0 && (
        <Text style={styles.expectedObjects}>
          Objetos a detectar: {reto.expectedObjects.join(', ')}
        </Text>
      )}

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
        La foto debe ser reciente (tomada en los últimos 30 minutos) y contener los objetos requeridos
      </Text>

      {/* Estado de verificación */}
      {verificationStatus === 'success' && (
        <View style={styles.resultContainer}>
          <Text style={styles.successText}>✓ Reto verificado correctamente</Text>
          {detectionResult?.bestDetection && (
            <Text style={styles.detectionInfo}>
              Detectado: {detectionResult.bestDetection.class} 
              ({(detectionResult.bestDetection.confidence * 100).toFixed(1)}%)
            </Text>
          )}
        </View>
      )}
      
      {verificationStatus === 'error' && (
        <View style={styles.resultContainer}>
          <Text style={styles.errorText}>⚠ El reto no se pudo verificar</Text>
          {detectionResult && (
            <TouchableOpacity 
              onPress={() => showDetectionDetails(detectionResult)}
              style={styles.detailsButton}
            >
              <Text style={styles.detailsButtonText}>Ver detalles</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4757" />
          <Text style={styles.loadingText}>Analizando imagen...</Text>
        </View>
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
    marginBottom: 15,
    textAlign: 'center',
  },
  expectedObjects: {
    fontSize: 14,
    color: '#FF4757',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 6,
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
  resultContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  successText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#FF4757',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detectionInfo: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
  detailsButton: {
    marginTop: 8,
    backgroundColor: '#FF4757',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FF4757',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RetoFoto;