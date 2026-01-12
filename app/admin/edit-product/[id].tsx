import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function EditProductScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#f8f9fa',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        inputBg: isDark ? '#2C2C2C' : '#ffffff',
        border: isDark ? '#333333' : '#ddd',
        placeholder: isDark ? '#888' : '#999',
        accent: '#007AFF'
    }), [isDark]);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [stock, setStock] = useState('10');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchCategories();
        if (id) fetchProductDetails();
    }, [id]);

    async function fetchCategories() {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    }

    async function fetchProductDetails() {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) {
            Alert.alert('Error', 'Could not fetch product details');
            router.back();
            return;
        }

        setName(data.name);
        setPrice(data.price.toString());
        setCategory(data.category_id);
        setDescription(data.description || '');
        setImageUrl(data.image_url);
        setStock(data.stock_quantity?.toString() || '0');
        setFetching(false);
    }

    async function pickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].base64, result.assets[0].uri.split('.').pop());
        }
    }

    async function uploadImage(base64: string | null | undefined, fileExt: string = 'jpg') {
        if (!base64) return;
        setUploading(true);
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, decode(base64), { contentType: 'image/' + fileExt });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
            setImageUrl(data.publicUrl);
            Alert.alert('Success', 'Image uploaded successfully!');
        } catch (error: any) {
            Alert.alert('Upload Error', error.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleUpdateProduct() {
        if (!name || !price || !category) {
            Alert.alert('Error', 'Please fill in Name, Price and Category.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('products').update({
            name,
            price: parseFloat(price),
            category_id: category,
            description,
            image_url: imageUrl,
            stock_quantity: parseInt(stock),
        }).eq('id', id);

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Product updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    }

    if (fetching) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Text style={[styles.heading, { color: theme.text }]}>Edit Product</Text>

            <View style={[styles.form, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.text }]}>Product Name</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    value={name} onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.text }]}>Price (FCFA)</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    value={price} onChangeText={setPrice} keyboardType="numeric"
                />

                <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                <View style={styles.categoryContainer}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.chip, category === cat.id ? { backgroundColor: theme.accent } : { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]}
                            onPress={() => setCategory(cat.id)}
                        >
                            <Text style={{ color: category === cat.id ? '#fff' : theme.text }}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border, height: 80 }]}
                    value={description} onChangeText={setDescription} multiline
                />

                <Text style={[styles.label, { color: theme.text }]}>Product Image</Text>
                <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                    onPress={pickImage} disabled={uploading}
                >
                    {uploading ? <ActivityIndicator color={theme.text} /> : imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} /> : (
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="camera-outline" size={32} color={theme.placeholder} />
                            <Text style={{ color: theme.placeholder, marginTop: 8 }}>Tap to Change Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleUpdateProduct} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Product</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    form: { padding: 20, borderRadius: 12, elevation: 2 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
    categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    uploadButton: { height: 200, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' }
});
