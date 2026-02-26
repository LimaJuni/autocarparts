import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Suggestion {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
}

interface Props {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
}

// Cameroon bounding box: SW(1.65, 8.50) → NE(13.08, 16.19)
const CAMEROON_VIEWBOX = '8.50,1.65,16.19,13.08';

export default function AddressAutocomplete({ value, onChange }: Props) {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback((text: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (text.length < 3) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Restrict to Cameroon: countrycodes=cm + viewbox keeps results inside the country
                const url =
                    `https://nominatim.openstreetmap.org/search` +
                    `?format=json` +
                    `&q=${encodeURIComponent(text)}` +
                    `&countrycodes=cm` +       // Cameroon only
                    `&viewbox=${CAMEROON_VIEWBOX}` +
                    `&bounded=1` +             // hard-restrict to viewbox
                    `&limit=6` +
                    `&addressdetails=0`;

                const res = await fetch(url, {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'AutoPartsDeliveryApp/1.0',
                    },
                });
                const data: Suggestion[] = await res.json();
                setSuggestions(data);
                setOpen(data.length > 0);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    }, []);

    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    const handleChange = (text: string) => {
        setQuery(text);
        onChange(text);
        search(text);
    };

    const selectSuggestion = (item: Suggestion) => {
        setQuery(item.display_name);
        setSuggestions([]);
        setOpen(false);
        onChange(item.display_name, parseFloat(item.lat), parseFloat(item.lon));
    };

    const clear = () => {
        setQuery('');
        setSuggestions([]);
        setOpen(false);
        onChange('');
    };

    return (
        <View style={styles.wrapper}>
            {/* Input row */}
            <View style={styles.inputRow}>
                <Ionicons name="search-outline" size={18} color="#FFCCCC" style={styles.searchIcon} />
                <TextInput
                    style={[styles.input, { color: '#fff' }]}
                    value={query}
                    onChangeText={handleChange}
                    placeholder=""
                    placeholderTextColor="#FFCCCC"
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {loading
                    ? <ActivityIndicator size="small" color="#FFCCCC" style={styles.endIcon} />
                    : query.length > 0 && (
                        <TouchableOpacity
                            onPress={clear}
                            style={styles.endIcon}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close-circle" size={18} color="#FFCCCC" />
                        </TouchableOpacity>
                    )
                }
            </View>

            {/* Dropdown — plain ScrollView to avoid FlatList nesting error */}
            {open && (
                <View style={styles.dropdown}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        {suggestions.map((item, index) => (
                            <TouchableOpacity
                                key={item.place_id}
                                style={[styles.item, index < suggestions.length - 1 && styles.itemBorder]}
                                onPress={() => selectSuggestion(item)}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="location-outline" size={16} color="#FFD700" style={{ marginTop: 2 }} />
                                <Text style={styles.itemText} numberOfLines={2}>
                                    {item.display_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { position: 'relative', zIndex: 99 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6b0000',
        borderWidth: 1,
        borderColor: '#c13030',
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    searchIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: 14 },
    endIcon: { marginLeft: 8 },

    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#5a0000',
        borderWidth: 1,
        borderColor: '#c13030',
        borderRadius: 10,
        marginTop: 4,
        maxHeight: 230,
        elevation: 10,
        zIndex: 100,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: '#7a0000' },
    itemText: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 18 },
});
