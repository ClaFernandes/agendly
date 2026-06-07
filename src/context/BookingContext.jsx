//BookingContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const BookingContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useBooking() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }) {
  const { slug } = useParams(); // Captura o ID/Slug da URL pública automaticamente

  // Estados do Negócio
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  // Estados do Fluxo de Agendamento (O que o cliente escolheu)
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientData, setClientData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: "",
  });

  // Busca os dados da empresa e os serviços ativos pelo slug da URL
  useEffect(() => {
    async function fetchPublicSpecs() {
      if (!slug) return;
      setLoadingBusiness(true);

      try {
        // 1. Busca o negócio pelo slug
        const { data: bData, error: bError } = await supabase
          .from("business")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (bError) throw bError;
        if (!bData) {
          const message = `Negócio não encontrado para o slug: ${slug}`;
          console.warn(message);
          setLoadingError(message);
          setBusiness(null);
          setServices([]);
          return;
        }

        setBusiness(bData);

        // 2. Busca os serviços desse negócio
        const { data: sData, error: sError } = await supabase
          .from("services")
          .select("*")
          .eq("business_id", bData.id)
          .eq("active", true); // usa a coluna correta do schema

        if (sError) throw sError;
        setServices(sData || []);
      } catch (err) {
        const message =
          err?.message || "Erro desconhecido ao carregar o estabelecimento.";
        console.error("Erro ao carregar página de agendamento:", message);
        setLoadingError(message);
        setBusiness(null);
        setServices([]);
      } finally {
        setLoadingBusiness(false);
      }
    }

    fetchPublicSpecs();
  }, [slug]);

  // Função para resetar o fluxo caso o cliente desista ou termine
  function resetBooking() {
    setSelectedService(null);
    setSelectedDate("");
    setSelectedTime("");
    setClientData({
      client_name: "",
      client_email: "",
      client_phone: "",
      notes: "",
    });
  }

  const value = {
    slug,
    business,
    services,
    loadingBusiness,
    loadingError,
    selectedService,
    setSelectedService,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    clientData,
    setClientData,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}
