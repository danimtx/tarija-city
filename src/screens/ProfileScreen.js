import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        console.log("Usuario actual:", currentUser.uid);
        if (currentUser) {
          const userRef = doc(db, "Usuarios", currentUser.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ email: currentUser.email });
          }
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        Alert.alert("Error", "No se pudieron cargar los datos del perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const calcularEdad = (fechaISO) => {
  if (!fechaISO) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaISO);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};


  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, "Usuarios", currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData({ email: currentUser.email });
        }
      }
    } catch (error) {
      console.error("Error al actualizar datos del usuario:", error);
      Alert.alert("Error", "No se pudieron actualizar los datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../../assets/default-avatar.png')}
            style={styles.profileImage}
            defaultSource={require('../../assets/default-avatar.png')}
            onError={() => console.log('Error cargando imagen')}
          />
        </View>
        <Text style={styles.userName}>{userData?.username || 'Usuario'}</Text>
        <View style={styles.pointsContainer}>
          <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
          <Text style={styles.pointsText}>{userData?.tarijapoints || 0} TarijaPoints</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <MaterialCommunityIcons name="refresh" size={22} color="white" />
        <Text style={styles.refreshText}>Actualizar</Text>
      </TouchableOpacity>


      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="email" size={22} color="#3498db" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData?.email || 'No disponible'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="phone" size={22} color="#3498db" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{userData?.telefono || 'No disponible'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="cake-variant" size={22} color="#3498db" style={styles.infoIcon} />
            <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Edad</Text>
            <Text style={styles.infoValue}>
              {userData?.fechaNacimiento ? calcularEdad(userData.fechaNacimiento) + " años" : "No disponible"}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="gender-male-female" size={22} color="#3498db" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Género</Text>
            <Text style={styles.infoValue}>
              {userData?.genero 
                ? userData.genero.charAt(0).toUpperCase() + userData.genero.slice(1) 
                : 'No disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="map-marker" size={22} color="#3498db" style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Dirección</Text>
            <Text style={styles.infoValue}>{userData?.direccion || 'No disponible'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    backgroundColor: '#3498db',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 5,
  },
  pointsText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  refreshButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F77F00',
  marginHorizontal: 15,
  marginTop: 20,
  paddingVertical: 12,
  borderRadius: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
refreshText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
  marginLeft: 8,
},
});