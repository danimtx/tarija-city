import axios from 'axios';
import * as FileSystem from 'expo-file-system';

class RoboflowService {
  constructor() {
    this.API_KEY = "pvMkGbJhTs0EmO7W4Wfu";
    this.API_URL = "https://detect.roboflow.com/karpil-detector/2";
    this.MIN_CONFIDENCE = 0.5; // Confianza mínima para considerar una detección válida
  }

  /**
   * Convierte una imagen URI a base64
   * @param {string} imageUri - URI de la imagen
   * @returns {Promise<string>} - Imagen en formato base64
   */
  async convertImageToBase64(imageUri) {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error(`Error al convertir imagen a base64: ${error.message}`);
    }
  }

  /**
   * Detecta objetos en una imagen usando Roboflow API
   * @param {string} imageUri - URI de la imagen a analizar
   * @returns {Promise<Object>} - Resultado de la detección
   */
  async detectObjects(imageUri) {
    try {
      // Convertir imagen a base64
      const base64Image = await this.convertImageToBase64(imageUri);

      // Realizar petición a Roboflow
      const response = await axios({
        method: "POST",
        url: this.API_URL,
        params: {
          api_key: this.API_KEY
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 30000 // 30 segundos de timeout
      });

      // Procesar respuesta
      const predictions = response.data.predictions || [];
      
      return {
        success: true,
        detectionsCount: predictions.length,
        detections: predictions,
        hasValidDetections: predictions.some(p => p.confidence >= this.MIN_CONFIDENCE),
        rawResponse: response.data
      };

    } catch (error) {
      console.error('Error en detectObjects:', error);
      
      let errorMessage = 'Error desconocido';
      if (error.response) {
        errorMessage = `Error del servidor: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Error de conexión. Verifica tu internet';
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        detectionsCount: 0,
        detections: [],
        hasValidDetections: false
      };
    }
  }

  /**
   * Verifica si el reto fue completado basado en las detecciones
   * @param {string} imageUri - URI de la imagen
   * @param {Array} expectedClasses - Clases de objetos esperados (opcional)
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  async verifyChallenge(imageUri, expectedClasses = []) {
    try {
      const result = await this.detectObjects(imageUri);
      
      if (!result.success) {
        return {
          verified: false,
          message: `Error al procesar imagen: ${result.error}`,
          details: result
        };
      }

      // Si no hay detecciones
      if (result.detectionsCount === 0) {
        return {
          verified: false,
          message: 'No se detectaron objetos en la imagen',
          details: result
        };
      }

      // Si no hay detecciones con confianza suficiente
      if (!result.hasValidDetections) {
        return {
          verified: false,
          message: 'Los objetos detectados tienen muy baja confianza',
          details: result
        };
      }

      // Si se especificaron clases esperadas, verificar que al menos una esté presente
      if (expectedClasses.length > 0) {
        const detectedClasses = result.detections
          .filter(d => d.confidence >= this.MIN_CONFIDENCE)
          .map(d => d.class.toLowerCase());
        
        const hasExpectedClass = expectedClasses.some(expectedClass =>
          detectedClasses.includes(expectedClass.toLowerCase())
        );

        if (!hasExpectedClass) {
          return {
            verified: false,
            message: `No se detectaron los objetos esperados: ${expectedClasses.join(', ')}`,
            details: result
          };
        }
      }

      // Reto verificado exitosamente
      const bestDetection = result.detections
        .filter(d => d.confidence >= this.MIN_CONFIDENCE)
        .sort((a, b) => b.confidence - a.confidence)[0];

      return {
        verified: true,
        message: `¡Reto completado! Se detectó: ${bestDetection.class} (${(bestDetection.confidence * 100).toFixed(1)}% confianza)`,
        bestDetection,
        details: result
      };

    } catch (error) {
      return {
        verified: false,
        message: `Error inesperado: ${error.message}`,
        details: null
      };
    }
  }

  /**
   * Obtiene estadísticas detalladas de las detecciones
   * @param {Object} detectionsResult - Resultado de detectObjects
   * @returns {Object} - Estadísticas organizadas
   */
  getDetectionStats(detectionsResult) {
    if (!detectionsResult.success || detectionsResult.detectionsCount === 0) {
      return {
        totalDetections: 0,
        validDetections: 0,
        classes: [],
        averageConfidence: 0
      };
    }

    const validDetections = detectionsResult.detections.filter(d => d.confidence >= this.MIN_CONFIDENCE);
    const classes = [...new Set(validDetections.map(d => d.class))];
    const avgConfidence = validDetections.reduce((sum, d) => sum + d.confidence, 0) / validDetections.length;

    return {
      totalDetections: detectionsResult.detectionsCount,
      validDetections: validDetections.length,
      classes,
      averageConfidence: avgConfidence || 0,
      detectionsByClass: classes.map(className => ({
        class: className,
        count: validDetections.filter(d => d.class === className).length,
        maxConfidence: Math.max(...validDetections.filter(d => d.class === className).map(d => d.confidence))
      }))
    };
  }

  /**
   * Configura la confianza mínima para las detecciones
   * @param {number} confidence - Valor entre 0 y 1
   */
  setMinConfidence(confidence) {
    if (confidence >= 0 && confidence <= 1) {
      this.MIN_CONFIDENCE = confidence;
    }
  }
}

// Exportar instancia singleton
export default new RoboflowService();