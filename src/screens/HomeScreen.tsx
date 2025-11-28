import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  FlatList, 
  Image, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../services/api';
import { Defeito } from '../types/Defeito';

export default function HomeScreen() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [defeitos, setDefeitos] = useState<Defeito[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    carregarDefeitos();
  }, []);

  const carregarDefeitos = async () => {
    try {
      const response = await api.get('/defeitos');
      setDefeitos(response.data);
    } catch (error) {
      console.log("Erro ao carregar:", error);
    }
  };

  const obterLocalizacao = async () => {
    setGpsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à localização.');
      setGpsLoading(false);
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLocal(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível pegar o GPS.');
    } finally {
      setGpsLoading(false);
    }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setFoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const salvarDefeito = async () => {
    if (!titulo || !local || !laboratorio) {
      Alert.alert('Campos vazios', 'Preencha Título, Local e Laboratório.');
      return;
    }
    setLoading(true);
    try {
      const novoDefeito = {
        titulo,
        descricao,
        local,
        laboratorio,
        foto,
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      };
      const response = await api.post('/defeitos', novoDefeito);
      setDefeitos([response.data, ...defeitos]);
      setTitulo('');
      setDescricao('');
      setLocal('');
      setLaboratorio('');
      setFoto(null);
      setLocation(null);
      Alert.alert('Sucesso', 'Registro salvo!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Defeito }) => (
    <View style={styles.card}>
      {item.foto && <Image source={{ uri: item.foto }} style={styles.cardImage} />}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <Text style={styles.cardBadge}>{item.laboratorio}</Text>
        <Text style={styles.cardLocal}>📍 {item.local}</Text>
        {item.descricao ? <Text style={styles.cardDesc}>{item.descricao}</Text> : null}
        {item.data && <Text style={styles.cardDate}>{new Date(item.data).toLocaleString()}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>📌 SisManutenção</Text>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Novo Defeito</Text>

          <TextInput
            style={styles.input}
            placeholder="Título"
            value={titulo}
            onChangeText={setTitulo}
          />
          <TextInput
            style={styles.input}
            placeholder="Laboratório"
            value={laboratorio}
            onChangeText={setLaboratorio}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Localização"
              value={local}
              onChangeText={setLocal}
            />
            <TouchableOpacity style={styles.gpsButton} onPress={obterLocalizacao}>
              {gpsLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.gpsText}>📍</Text>}
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, foto ? styles.buttonActive : styles.buttonGray]}
              onPress={tirarFoto}
            >
              <Text style={styles.buttonText}>{foto ? "✅ Foto" : "📷 Foto"}</Text>
            </TouchableOpacity>
            {foto && <Image source={{ uri: foto }} style={styles.miniPreview} />}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={salvarDefeito}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          <FlatList
            data={defeitos}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eef6f9' },
  container: { padding: 20 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#0e7291' },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  formContainer: { marginBottom: 30 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ccc', fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  gpsButton: { backgroundColor: '#0e7291', padding: 12, borderRadius: 10, marginLeft: 8 },
  gpsText: { color: '#fff', fontSize: 18 },
  textArea: { height: 90, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  button: { padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flex: 1 },
  buttonGray: { backgroundColor: '#6c757d' },
  buttonActive: { backgroundColor: '#28a745' },
  saveButton: { backgroundColor: '#0e7291', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  miniPreview: { width: 50, height: 50, borderRadius: 8, marginLeft: 10 },
  listContainer: { marginBottom: 30 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardBadge: { backgroundColor: '#d0ebff', color: '#0e7291', fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
  cardLocal: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#444', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#888', marginTop: 4 },
});
