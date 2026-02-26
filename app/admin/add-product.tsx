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
        bg: '#8B0000',
        card: '#a11212',
        inputBg: '#6b0000',
        text: '#FFFFFF',
        subtext: '#FFCCCC',
        accent: '#FFD700',
        border: '#c13030',
        placeholder: '#FFCCCC88'
    }), []);

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
            <StatusBar barStyle="light-content" />
            <Text style={[styles.heading, { color: '#fff' }]}>Add New Product</Text>

            <View style={[styles.form, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.text }]}>Product Name</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    placeholder=""
                    placeholderTextColor={theme.placeholder}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.text }]}>Price (FCFA)</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    placeholder=""
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
                            <Text style={{ color: category === cat.id ? '#8B0000' : theme.text, fontWeight: '700' }}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border, height: 100 }]}
                    placeholder=""
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
                        <ActivityIndicator color={theme.accent} />
                    ) : imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="cloud-upload-outline" size={40} color={theme.accent} />
                            <Text style={{ color: theme.subtext, marginTop: 12, fontWeight: '600' }}>Upload Product Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Hidden URL input fallback */}
                <View style={{ height: 1, overflow: 'hidden' }}>
                    <TextInput value={imageUrl} onChangeText={setImageUrl} />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.accent }]}
                    onPress={handleAddProduct}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#8B0000" /> : <Text style={styles.buttonText}>Publish Product</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    heading: { fontSize: 26, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
    form: { padding: 20, borderRadius: 24, elevation: 4, borderWidth: 1, borderColor: '#c13030', marginBottom: 40 },
    label: { fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600' },
    categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    button: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32, elevation: 6 },
    buttonText: { color: '#8B0000', fontWeight: '900', fontSize: 17 },
    uploadButton: { height: 220, borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 8, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' }
});
