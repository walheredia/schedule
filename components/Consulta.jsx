import React, {useEffect, useState} from 'react';
import { 
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    FlatList,
    Vibration,
    TouchableHighlight,
    TouchableOpacity,
    Modal,
    Pressable,
    Alert,
    TextInput,
    Switch,
    Linking
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import moment from 'moment'
import Ionicons from 'react-native-vector-icons/Ionicons';
import {LocaleConfig} from 'react-native-calendars';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Autocomplete from 'react-native-autocomplete-input';
import NumericInput from 'react-native-numeric-input';
import {store} from '../src/firebaseconfig'
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Setting a timer']);

LocaleConfig.locales['es'] = {
    monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
    dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
    dayNamesShort: ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'],
    today: 'Aujourd\'hui'
  };
LocaleConfig.defaultLocale = 'es';

const uid = 'ENStPjDumVc1J2pMrJ8Q18gnzQ52' //user id
const eid = 'BtRfI2D5tvX9Vc0bSwrY' //empresa id

export default function Consulta() {
    const [eventos, setEventos] = useState({})    
    const [cargando, setCargando] = useState(false)
    const [habilitado, setHabilitado] = useState(false)
    const [turnos, setTurnos] = useState({})
    const [modalVisible, setModalVisible] = useState(false)
    const [modalInfoTurnoVisible, setModalInfoTurnoVisible] = useState(false)
    const [infoTurno, setInfoTurno] = useState({})
    const [selectedDay, setSelectedDay] = useState('')
    
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
    const [fechaTurno, setFechaTurno] = useState('')
    const [hideRes, setHideRes] = useState(false)
    const [fijo, setFijo] = useState(false)
    const toggleSwitch = () => setFijo(previousState => !previousState)
    const dotFijo = {key:'xxF', color:'#673ab7', selectedDotColor:'white'}
    const dotComun = {key:'xxx', color:'red', selectedDotColor:'white'}
    const [seleccionoFecha, setSeleccionoFecha] = useState(false)
    const [ultimoMes, setUltimoMes] = useState({})

    function findCliente(query, clientes) {
        if (query === '') {
          return [];
        }
        const regex = new RegExp(`${query.trim()}`, 'i');
        return clientes.filter((cliente) => cliente.nombre.search(regex) >= 0);
    }
    const [allClientes, setAllClientes] = useState([]);
    const [query, setQuery] = useState('');
    const clientes = findCliente(query, allClientes);
    const [telefono, setTelefono] = useState('')
    const [editTel, setEditTel] = useState(true)
    const [id_cliente, setIdCliente] = useState('')
    const [duracion, setDuracion] = useState(1)
    const [guardando, setGuardando] = useState(false)
    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };
    
    const handleConfirm = (date) => {
        setTimeout(() => {
            setFechaTurno(moment(date).format('YYYY-MM-DD HH:mm').toString()) 
            setSelectedDay(moment(date).format('YYYY-MM-DD HH:mm').toString())
        }, );
        hideDatePicker();
    };

    useEffect(() => {
        setSeleccionoFecha(false)
        let today = {};
        today.month = moment().format('M').toString();
        today.year = moment().format('YYYY').toString();
        getEventos(today, true)
    },[])

    const getEventos = async (mes, cargarEventos) => {
        let ulMes = new Date();
        if(ultimoMes && ultimoMes.month){
            ulMes = moment(`${mes.year}-${+mes.month < 10 ? '0' + mes.month : mes.month}-01`).add(1, 'M').add(-1, 's')
        }
        setTurnos({})
        setCargando(true)
        let desde = moment(`${mes.year}-${+mes.month < 10 ? '0' + mes.month : mes.month}-01`)
        let hasta = desde.clone().add(1, 'M')
        hasta.add(-1, 's')
        
        //cargo turnos comunes (no fijos)
        const {docs} = await store.collection('agenda') 
            .where('fecha_timestamp', '>=', desde.toDate())
            .where('fecha_timestamp', '<=', hasta.toDate())
            .where('fijo', '==', false)
            .where('eid', '==', eid)
            .get()
        const itemsAgenda = docs.map(agenda => ({
            id: agenda.id, ...agenda.data()
        }))
        let ev = {}
        itemsAgenda.forEach(row => {
            ev[moment(row.fecha).format('YYYY-MM-DD').toString()] = {dots: [dotComun], selectedColor: '#673ab7'}
        });
        //fin carga turnos comunes
        
        //inicio carga de turnos fijos
        const itemsFijos = await getTurnosFijos()
        let dom = false
        let lun = false
        let mar = false
        let mie = false
        let jue = false
        let vie = false
        let sab = false

        itemsFijos.forEach(fijo => {
            let fecha = moment(fijo.fecha)
            let dia = fecha.format('dd')
            if(
                (dia == 'do' && dom == true) ||
                (dia == 'lu' && lun == true) ||
                (dia == 'ma' && mar == true) ||
                (dia == 'mi' && mie == true) ||
                (dia == 'ju' && jue == true) ||
                (dia == 'vi' && vie == true) ||
                (dia == 'sá' && sab == true)
            ){
                return
            }
            
            switch (dia) {
                case 'do':
                    dom = true;
                    break;
                case 'lu':
                    lun = true;
                break;
                case 'ma':
                    mar = true;
                break;
                case 'mi':
                    mie = true;
                break;
                case 'ju':
                    jue = true;
                break;
                case 'vi':
                    vie = true;
                break;
                case 'sá':
                    sab = true;
                break;
                default:
                    break;
            }
           
            let salir = 0
            while (!salir) {
                if(ev[moment(fecha).format('YYYY-MM-DD').toString()]){
                    ev[moment(fecha).format('YYYY-MM-DD').toString()].dots.push(dotFijo)
                } else {
                    ev[moment(fecha).format('YYYY-MM-DD').toString()] = {dots: [dotFijo], selectedColor: '#673ab7'}
                }
                fecha.add(7, 'd')
                if(fecha >= (ultimoMes && ultimoMes.month ? ulMes : hasta)){ //siempre se agregan eventos hasta el mes consultado
                    salir = 1
                }
            }
        });
        //fin carga de turnos fijos

        cargarEventos ? setEventos(ev) : ''
        setCargando(false)
        setHabilitado(true)
    }

    const getTurnosFijos = async () => {
        const {docs} = await store.collection('agenda')
            .where('fijo', '==', true)
            .where('eid', '==', eid)
            .orderBy('fecha_timestamp')
            .get()
        const itemsFijos = docs.map(agenda => ({
            id: agenda.id, ...agenda.data()
        }))
        return itemsFijos
    }

    const selectDay = (dia) => {
        setSeleccionoFecha(true)
        setSelectedDay(dia.dateString)
        let encontrado = false
        let ev = JSON.parse(JSON.stringify(eventos));
        Object.keys(ev).map(key => {
            if(dia.dateString == key){ //Si encuentro la fecha en los eventos, lo seteo como 'selected'
                encontrado = true
                ev[key].selected = true
            } else { //sino, seteado a false
                ev[key].selected = false
            }
        })
        if(!encontrado){ //si nunca encontré la fecha en los eventos, la agrego.
            ev = {...ev, ...{[dia.dateString] : {selected: true, selectedColor: '#673ab7'}}}
        }
        setEventos(ev)
        setHabilitado(true)
        cargarTurnos(dia)
    }

    const cargarTurnos = async (dia) => {
        setCargando(true)
        setTurnos({})
        let desde = moment(`${dia.dateString}`)
        let hasta = desde.clone().add(1, 'd')
        hasta.add(-1, 's')
        const {docs} = await store.collection('agenda')
            .where('fecha_timestamp', '>=', desde.toDate())
            .where('fecha_timestamp', '<=', hasta.toDate())
            .where('fijo', '==', false)
            .where('eid', '==', eid)
            .get()
        
        const itemsAgenda = docs.map(agenda => ({
            key: agenda.id,
            title: agenda.data().nombre,
            fijo: agenda.data().fijo,
            fecha_timestamp: agenda.data().fecha_timestamp,
            fecha: agenda.data().fecha,
            duracion: agenda.data().duracion,
            telefono: agenda.data().telefono
        }))
        
        //inicio carga de turnos fijos
        let fecha = moment(dia.dateString)
        let diaSelect = fecha.format('dd')
        const itemsFijos = await getTurnosFijos()
        itemsFijos.forEach(fijo => {
            if(
                (moment(fijo.fecha).format('dd') == diaSelect) &&
                (moment(fijo.fecha).format('YYYY-MM-DD') <= fecha.format('YYYY-MM-DD'))
            ){
                fijo.key = fijo.id
                fijo.title = fijo.nombre
                itemsAgenda.push(fijo)
            }
        });
        const sortedItems = itemsAgenda.sort((a, b) => {
            let newA = moment((moment().format('YYYY-MM-DD') + ' ' + moment(a.fecha).format('HH:mm')).toString()).toDate()
            let newB = moment((moment().format('YYYY-MM-DD') + ' ' + moment(b.fecha).format('HH:mm')).toString()).toDate()
            return newA - newB
        })
        //fin carga de turnos fijos
        itemsAgenda && itemsAgenda.length > 0 ? setTurnos(sortedItems): setTurnos({})
        setCargando(false)
    }

    const nuevoTurnoPress = async () => {
        setDatePickerVisibility(false)
        if (!seleccionoFecha) {
            Alert.alert(
                'Atención',
                'Primero seleccione una fecha del calendario, por favor'
            )
            return;
        }
        setModalVisible(true)
        setFechaTurno(fechaTurno)
        setQuery('')
        setDuracion(1)
        setFijo(false)
        setTelefono('')
        const {docs} = await store.collection('clientes').where('eid', '==', eid).get()
        const arrayClientes = docs.map(cliente => ({
            id: cliente.id, ...cliente.data()
        }))
        setAllClientes(arrayClientes)
        setEditTel(true)
        setTimeout(() => {
            setDatePickerVisibility(true)
        }, 250);
    }

    const onGuardarPress = async () => {
        setGuardando(true)
        try {
            if(!fechaTurno){
                Alert.alert("Error", "El campo Fecha no puede estar vacío")
                setGuardando(false)
                return
            }
            if(!duracion){
                Alert.alert("Error", "El campo Duración no puede estar vacío")
                setGuardando(false)
                return
            }
            if(!query){
                Alert.alert("Error", "El campo Cliente no puede estar vacío")
                setGuardando(false)
                return
            }
            
            let arrayClientes = []
            if(id_cliente === ''){
                const cliente = {
                    nombre: query,
                    telefono: telefono,
                    uid: uid,
                    eid: eid
                }
                await store.collection('clientes').add(cliente)
                const {docs} = await store.collection('clientes')
                    .where('nombre', '==', query)
                    .where('telefono', '==', telefono)
                    .where('eid', '==', eid)
                    .get()
                arrayClientes = docs.map(cliente => ({
                    id: cliente.id, ...cliente.data()
                }))
            }
            
            const turno = {
                fecha: fechaTurno,
                fecha_timestamp: moment(fechaTurno).toDate(),
                duracion: duracion,
                cliente_id: id_cliente == '' ? arrayClientes[0].id : id_cliente,
                nombre: query,
                telefono: telefono,
                fijo: fijo,
                uid: uid,
                eid: eid
            }
            await store.collection('agenda').add(turno)
            setModalVisible(false)
            setGuardando(false)
            Alert.alert(
                'Excelente', 
                'Se ha guardado el turno en la agenda',
                [
                    {
                        text: 'Aceptar',
                        onPress: () => {
                            let eventos = {};
                            eventos.month = moment(fechaTurno).format('M').toString();
                            eventos.year = moment(fechaTurno).format('YYYY').toString();
                            getEventos(eventos, true)
                            setSeleccionoFecha(false)
                            /*selectDay({dateString : moment(fechaTurno).format('YYYY-MM-DD')})*/
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert("Error", "Ocurrió un error al procesar la solicitud");
        }
    }

    const pregEliminar = async (item) => { 
        //let fecha = {dateString : moment(item.fecha).format('YYYY-MM-DD')}
        Alert.alert(
            'Eliminar Turno', 
            `¿Realmente desea eliminar el turno de ${item.title} para el día ${moment(item.fecha).format('DD-MM-YYYY HH:mm').toString()}hs?`,
            [
                {
                    text: "Cancelar"
                },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        await store.collection('agenda').doc(item.key).delete()
                        Alert.alert(
                            'Excelente', 
                            'El turno se ha eliminado exitosamente',
                            [
                                {
                                    text: 'Aceptar',
                                    onPress: () => {
                                        let eventos = {};
                                        eventos.month = moment(item.fecha).format('M').toString();
                                        eventos.year = moment(item.fecha).format('YYYY').toString();
                                        getEventos(eventos, true)
                                        //selectDay(fecha)
                                    }
                                }
                            ]
                        )
                    },
                }
            ]
        )
    }

    return (
        <View >
            <Calendar
                style={styles.calendar}
                markedDates={eventos}
                markingType = 'multi-dot'
                onDayPress={(day) => {
                    selectDay(day)
                    Vibration.vibrate(40)
                }}
                monthFormat={'yyyy MM'}
                onMonthChange={(month) => {
                    setUltimoMes(month)
                    getEventos(month, true)
                    setSeleccionoFecha(false)
                }}
                hideArrows={false}
                renderArrow={(direction) => direction === 'left' ? <Ionicons name="arrow-back"/> : <Ionicons name="arrow-forward"/>}
                hideExtraDays={true}
                disableMonthChange={false}
                firstDay={1}
                hideDayNames={false}
                showWeekNumbers={false}
                onPressArrowLeft={ subtractMonth => {subtractMonth(), setHabilitado(true)}}
                onPressArrowRight={addMonth => {addMonth(), setHabilitado(true)}}
                disableArrowLeft={habilitado ? false: true}
                disableArrowRight={habilitado ? false: true}
                disableAllTouchEventsForDisabledDays={true}
                renderHeader={(month) => {
                var dt = month[0];
                return(<Text>{moment(dt).format('MMMM YYYY')}</Text>)
                }}
                enableSwipeMonths={habilitado ? true: false}
            />

            <Ionicons
                style={styles.btnAdd}
                onPress={() => {
                    Vibration.vibrate(40)
                    nuevoTurnoPress()
                }}
                name="add-circle-outline"
                size={36}
                color="#673ab7"
            />
            
            {
                cargando ? 
                <ActivityIndicator color="#673ab7" size="large" style={styles.loading} /> 
                    :
                <FlatList style={styles.lista}
                    ItemSeparatorComponent={
                        Platform.OS !== 'android' &&
                        (({ highlighted }) => (
                            <View
                                style={[
                                    style.separator,
                                    highlighted && { marginLeft: 0 }
                                ]}
                            />
                        ))
                    }
                    data={turnos}
                    renderItem={({ item, index, separators }) => (
                        <TouchableHighlight
                            style={styles.touchable}
                            key={item.key}
                            onPress={() => ''}
                            onLongPress={() => {
                                Vibration.vibrate(40)
                                pregEliminar(item)
                            }}
                            onShowUnderlay={separators.highlight}
                            onHideUnderlay={separators.unhighlight}>
                            <View style={styles.lItems}>
                                <Text style={styles.itemListado}>
                                    {moment(item.fecha).format('HH:mm')}
                                    {` ` + item.title}
                                    <Text style={styles.fijo}>{item.fijo? ' Fijo ':''}
                                    </Text>
                                </Text>
                                <Ionicons 
                                    onPress={() => {
                                        Vibration.vibrate(40)
                                        setInfoTurno(item)
                                        setModalInfoTurnoVisible(!modalInfoTurnoVisible)
                                    }}
                                    style={styles.turnoInfo} 
                                    name="ios-information-circle-outline"
                                />
                            </View>
                        </TouchableHighlight>
                    )}
                />
            }

            <Modal
                animationType='slide'
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                    setFechaTurno('')
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>¡Reserva de Turnos!</Text>
                        <DateTimePickerModal
                            isVisible={isDatePickerVisible}
                            isDarkModeEnabled={true}
                            date={
                                selectedDay ? moment(selectedDay).toDate() : moment().toDate()
                            }
                            mode="time"
                            locale="es_AR"
                            onConfirm={handleConfirm}
                            onCancel={() => {
                                fechaTurno ? '' : setFechaTurno('')
                                hideDatePicker
                                setModalVisible(false)
                            }}
                        />
                        {
                            fechaTurno ? 
                                (
                                    <Text
                                        onPress={() => {
                                            setFechaTurno(fechaTurno ? fechaTurno : selectedDay)
                                            setDatePickerVisibility(true)
                                        }}
                                        style={styles.fecha}
                                    >
                                        Fecha: <Text style={styles.highlight}>{moment(fechaTurno).format('DD-MM-YYYY HH:mm').toString()}hs</Text>
                                    </Text>
                                )
                                : 
                                (
                                    <Text
                                        style={styles.fecha}
                                    > 
                                    </Text>
                                )
                        }
                        <Text style={styles.duracionText}>¿Duración? (Hs.)</Text>
                        <NumericInput 
                            containerStyle={styles.numInput}
                            value={duracion} 
                            minValue={1}
                            maxValue={24}
                            onChange={value => setDuracion(value)} 
                            onLimitReached={(isMax,msg) => {}/*console.log(isMax,msg)*/}
                            totalWidth={208} 
                            totalHeight={40} 
                            iconSize={10}
                            step={1}
                            valueType='integer'
                            rounded 
                            textColor='#673ab7' 
                            iconStyle={{ color: 'white' }} 
                            rightButtonBackgroundColor='#673ab7' 
                            leftButtonBackgroundColor='#673ab7'
                        />
                        <View style={styles.autocompleteContainer}>
                            <Autocomplete 
                                inputContainerStyle={styles.auC}
                                data={clientes}
                                placeholder="Nombre y Apellido del Cliente"
                                value={query}
                                autoCorrect={false}
                                hideResults={hideRes}
                                onChangeText={(text) => {
                                    setQuery(text)
                                    setTelefono('')
                                    setIdCliente('')
                                    setHideRes(false)
                                    setEditTel(true)
                                }}
                                flatListProps={{
                                    nestedScrollEnabled: true,
                                    keyExtractor: (item) => item.id.toString(),
                                    renderItem: ({item, i}) => (
                                        <TouchableOpacity 
                                            style={styles.optionItem}
                                            onPress={() => {
                                                setQuery(item.nombre)
                                                setTelefono(item.telefono)
                                                setIdCliente(item.id)
                                                setHideRes(true)
                                                setEditTel(false)
                                            }}
                                        >
                                            <Text style={styles.itemText}>{item.nombre}</Text>
                                        </TouchableOpacity>
                                    )
                                }}
                            />
                        </View>
                        
                        <TextInput
                            style={styles.tel}
                            editable={editTel}
                            onChangeText={(text) => {
                                setTelefono(text)
                                setIdCliente('')
                            }}
                            placeholder="Teléfono"
                            keyboardType="numeric"
                            value={telefono}
                        />
                        <View style={styles.inline}>
                            <Text style={styles.tFijo}>¿Turno Fijo semanal? </Text>
                            <Switch
                                trackColor={{ false: "#767577", true: "#8d5ce6" }}
                                thumbColor={fijo ? "#673ab7" : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleSwitch}
                                value={fijo}
                            />
                        </View>
                        
                        {
                            guardando ? 
                            (
                                <ActivityIndicator color="#673ab7" size="large" /> 
                            ) : 
                            (
                                <View style={styles.inline}>
                                    <Pressable
                                        style={[styles.button, styles.buttonAccept]}
                                        onPress={() => onGuardarPress()}>
                                        <Text style={styles.textStyle}>Guardar</Text>
                                    </Pressable>
                                        <Pressable
                                        style={[styles.button, styles.buttonClose]}
                                        onPress={() => {
                                            setDatePickerVisibility(false)
                                            setModalVisible(!modalVisible)
                                        }}>
                                        <Text style={styles.textStyle}>Cancelar</Text>
                                    </Pressable>
                                </View>
                            )
                        }
                        
                    </View>
                </View>
            </Modal>
            
            <Modal
                animationType='slide'
                transparent={true}
                visible={modalInfoTurnoVisible}   
            >
               <View style={styles.centeredView}>
                    <View style={styles.modalViewLeft}>
                        <Text style={styles.modalTextTitle}>¡Información del Turno!</Text>
                        <Text style={styles.infoTurnoItem}>
                            Cliente: <Text style={{fontWeight:'bold'}}>{infoTurno.title}</Text>
                        </Text>
                        <Text style={styles.infoTurnoItem}>
                            Inicio: <Text style={{fontWeight:'bold'}}>{moment(infoTurno.fecha).format('ddd DD/MM HH:mm') + 'hs.'}</Text>
                        </Text>
                        <Text style={styles.infoTurnoItem}>
                            Duración: <Text style={{fontWeight:'bold'}}>{infoTurno.duracion > 1 ? infoTurno.duracion + 'hs.' : infoTurno.duracion + 'h.' }</Text>
                        </Text>
                        <Text 
                            style={styles.infoTurnoItem}
                        >
                            Teléfono: <Text style={{fontWeight:'bold'}}>{infoTurno.telefono}</Text>
                        </Text>
                        <Text
                            style={{fontWeight:'bold', fontSize: 17, textAlign:'justify', fontStyle:'italic'}}
                        >
                            {infoTurno.fijo ? (
                                'Es un Turno Fijo Semanal'
                            ):
                            (
                                'Es un Turno Común'
                            )}
                        </Text>
                        <View style={styles.inline}> 
                            <Pressable
                                style={[styles.button, styles.buttonAcceptShort, styles.mTop]}
                                onPress={() => {
                                    Vibration.vibrate(40)
                                    Linking.openURL(`tel:${infoTurno.telefono}`)
                                }}>
                                <Text style={styles.textStyle}>
                                <Ionicons
                                    style={styles.turnoInfoCall} 
                                    name="md-call-outline"
                                />
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.button, styles.buttonAcceptShort, styles.mTop]}
                                onPress={() => {
                                    Vibration.vibrate(40)
                                    Linking.openURL(`whatsapp://send?text=Hola ${infoTurno.title}&phone=+54${infoTurno.telefono}`)
                                }}>
                                <Text style={styles.textStyle}>
                                <Ionicons
                                    style={styles.turnoInfoCall} 
                                    name="ios-logo-whatsapp"
                                />
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.button, styles.buttonAccept, styles.mTop]}
                                onPress={() => {
                                    Vibration.vibrate(40)
                                    setModalInfoTurnoVisible(!modalInfoTurnoVisible)
                                    }}>
                                <Text style={styles.textStyle}>Cerrar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    calendar: {
        marginTop: 35,
        minHeight: 350
    },
    btnAdd: {
        backgroundColor: 'transparent',
        borderRadius: 50,
        right: 36,
        top: 338,
        position: 'absolute',
    },
    loading: {
        marginTop: 100,
    },
    lItems: {
        padding: 10,
        backgroundColor: 'white',
        flexWrap: 'wrap', 
        alignItems: 'flex-start',
        flexDirection:'row',
    },
    itemListado: {
        fontSize: 19,
    },
    lista:{
        marginBottom: 386,
        flex: 0
    },
    touchable: {
        marginTop: 1,
    },
    fijo: {
        fontSize: 14,
        color: '#673ab7',
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    turnoInfo: {
        flexDirection: 'column',
        fontSize: 25,
        color: '#673ab7',
        fontWeight: 'bold',
        position: 'absolute',
        right: 10,
        marginTop: 10
    },
    turnoInfoCall: {
        flexDirection: 'column',
        fontSize: 17,
        color: 'white'
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 300
    },
    modalViewLeft: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        //alignItems: "",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 300
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
    },
    buttonAccept: {
        backgroundColor: "#673ab7",
        marginEnd: 5,
        minWidth: 100
    },
    buttonAcceptShort: {
        backgroundColor: "#673ab7",
        marginEnd: 5,
        minWidth: 65,
        maxWidth: 65,
    },
    mTop: {
        marginTop: 10
    },
    buttonClose: {
        backgroundColor: "gray",
        minWidth: 100
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 17
    },
    modalTextTitle: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 22
    },
    inline:{
        flexWrap: 'wrap', 
        alignItems: 'flex-start',
        flexDirection:'row',
        zIndex: 2
    },
    fecha: {
        fontSize: 17,
        textAlign: 'left',
        marginBottom: 2
    },
    highlight: {
        fontWeight: 'bold'
    },
    autocompleteContainer: {
        flex: 1,
        left: 47,
        position: 'absolute',
        right: 10,
        top: 175,
        maxWidth: 206,
        zIndex: 10
    },
    optionItem:{

    },
    itemText: {
        fontSize: 17,
        margin: 2,
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        borderColor: 'gray',
        alignSelf: 'stretch',
        paddingStart: 4,
    },
    tel: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        borderColor: 'gray',
        alignSelf: 'stretch',
        paddingStart: 4,
        marginTop: 55
    },
    auC: {
        borderColor: 'gray',
        borderWidth: 1,
        borderBottomWidth: 1,
    },
    tFijo: {
        marginTop: 1,
        fontSize: 16,
        marginBottom: 20
    },
    duracionText: {
        fontSize: 16,
        marginTop: 5
    },  
    numInput: {
        marginTop: 5,
        marginBottom: 0
    },
    infoTurnoItem: {
        fontSize: 18,
        alignItems: 'flex-start'
    }
})
