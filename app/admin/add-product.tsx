import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AddProductScreen() {
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

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
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
                .upload(filePath, decode(base64), {
                    contentType: 'image/' + fileExt,
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
            setImageUrl(data.publicUrl);
            Alert.alert('Success', 'Image uploaded successfully!');
        } catch (error: any) {
            Alert.alert('Upload Error', error.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleAddProduct() {
        if (!name || !price || !category) {
            Alert.alert('Error', 'Please fill in Name, Price and Category.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('products').insert({
            name,
            price: parseFloat(price),
            category_id: category,
            description,
            image_url: imageUrl || 'https://loremflickr.com/400/400/carpart',
            stock_quantity: parseInt(stock),
            vendor_id: (await supabase.auth.getUser()).data.user?.id
        });

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Product added successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Text style={[styles.heading, { color: theme.text }]}>Add New Product</Text>

            <View style={[styles.form, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.text }]}>Product Name</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    placeholder="e.g. Brake Caliper"
                    placeholderTextColor={theme.placeholder}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.text }]}>Price (FCFA)</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    placeholder="e.g. 25000"
                    placeholderTextColor={theme.placeholder}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />

                <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                <View style={styles.categoryContainer}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.chip,
                                category === cat.id ? { backgroundColor: theme.accent } : { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }
                            ]}
                            onPress={() => setCategory(cat.id)}
                        >
                            <Text style={{ color: category === cat.id ? '#fff' : theme.text }}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border, height: 80 }]}
                    placeholder="Product details..."
                    placeholderTextColor={theme.placeholder}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <Text style={[styles.label, { color: theme.text }]}>Product Image</Text>

                <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                    onPress={pickImage}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color={theme.text} />
                    ) : imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="camera-outline" size={32} color={theme.placeholder} />
                            <Text style={{ color: theme.placeholder, marginTop: 8 }}>Tap to Upload Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Hidden URL input fallback */}
                <View style={{ height: 1, overflow: 'hidden' }}>
                    <TextInput value={imageUrl} onChangeText={setImageUrl} />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleAddProduct} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publish Product</Text>}
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
