import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { calculateCartTotals, formatCurrency } from '../utils/pricing';
import { buildWhatsAppUrl, formatWhatsAppMessage } from '../utils/whatsapp';
import { DeliveryType, PaymentMethod } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  Crown,
  Bike,
  Store,
  QrCode,
  DollarSign,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  MapPin,
  User,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    settings,
    placeOrder,
  } = useStore();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');

  // Address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needChange, setNeedChange] = useState<boolean>(false);
  const [changeForValue, setChangeForValue] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Errors & Success state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedOrderText, setCopiedOrderText] = useState(false);
  const [completedOrderUrl, setCompletedOrderUrl] = useState<string | null>(null);
  const [completedOrderMessage, setCompletedOrderMessage] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const { subtotal, deliveryFee, total } = calculateCartTotals(
    cart,
    deliveryType,
    settings.deliveryFee
  );

  // Auto-fetch CEP via ViaCEP
  const handleCepLookup = async (cepInput: string) => {
    const clean = cepInput.replace(/\D/g, '');
    setCep(cepInput);
    if (clean.length === 8) {
      try {
        setIsLoadingCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
        }
      } catch (e) {
        console.error('Erro ao buscar CEP:', e);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleCopyOrderText = () => {
    if (completedOrderMessage) {
      navigator.clipboard.writeText(completedOrderMessage);
      setCopiedOrderText(true);
      setTimeout(() => setCopiedOrderText(false), 2000);
    }
  };

  const handleFinalizeWhatsAppOrder = async () => {
    if (isSubmitting) return;
    setErrorMessage(null);

    // Validations
    if (cart.length === 0) {
      setErrorMessage('Seu carrinho está vazio. Adicione produtos antes de finalizar.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Por favor, informe seu telefone ou WhatsApp para contato.');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!street.trim()) {
        setErrorMessage('Por favor, informe o nome da sua rua / avenida.');
        return;
      }
      if (!number.trim()) {
        setErrorMessage('Por favor, informe o número do imóvel.');
        return;
      }
      if (!neighborhood.trim()) {
        setErrorMessage('Por favor, informe o seu bairro.');
        return;
      }
    }

    let parsedChange: number | undefined = undefined;
    if (paymentMethod === 'cash' && needChange) {
      const val = parseFloat(changeForValue.replace(',', '.'));
      if (isNaN(val) || val <= total) {
        setErrorMessage(`O valor do troco deve ser maior que o total do pedido (${formatCurrency(total)}).`);
        return;
      }
      parsedChange = val;
    }

    const orderPayload = {
      customer: {
        name: name.trim(),
        phone: phone.trim(),
      },
      deliveryType,
      address: deliveryType === 'delivery'
        ? {
            cep: cep.trim(),
            street: street.trim(),
            number: number.trim(),
            neighborhood: neighborhood.trim(),
            complement: complement.trim() || undefined,
            reference: reference.trim() || undefined,
          }
        : undefined,
      paymentMethod,
      cashChangeFor: parsedChange,
      items: cart,
      subtotal,
      deliveryFee,
      total,
    };

    // Format the official comanda
    const formattedMessage = formatWhatsAppMessage(orderPayload);

    try {
      setIsSubmitting(true);
      // Persist order via API + SQLite
      await placeOrder({
        ...orderPayload,
        notes: formattedMessage,
      });

      // Build WhatsApp URL using the official number
      const waUrl = buildWhatsAppUrl(settings.whatsappNumber, formattedMessage);

      // Confetti effect!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#DC2626', '#FFFFFF'],
        });
      } catch {
        // ignore
      }

      // Set completed state to display confirmation screen with direct button and copy
      setCompletedOrderUrl(waUrl);
      setCompletedOrderMessage(formattedMessage);

      // Open WhatsApp link in new tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Não foi possível registrar seu pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar Pedido"
        className="relative w-full max-w-2xl bg-[#10121b] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#151724] border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-royal text-white">
                Finalizar Pedido • King Pizzaria
              </h2>
              <p className="text-xs text-amber-300/80">
                Seus dados serão enviados diretamente para o nosso WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            aria-label="Fechar checkout"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Success Screen if completed */}
          {completedOrderUrl ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center mx-auto shadow-xl shadow-amber-500/25">
                <Crown className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black font-royal text-white">
                  Pedido Pronto para o WhatsApp!
                </h3>
                <p className="text-sm text-gray-300 max-w-md mx-auto">
                  A comanda da <strong>King Pizzaria</strong> foi gerada. Clique no botão abaixo para confirmar e enviar sua mensagem no WhatsApp.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="max-w-md mx-auto space-y-2.5 pt-2">
                <a
                  href={completedOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02]"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>ABRIR WHATSAPP E ENVIAR COMANDA</span>
                </a>

                <button
                  onClick={handleCopyOrderText}
                  className="w-full py-3 px-4 bg-[#181a28] hover:bg-[#222538] text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  {copiedOrderText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedOrderText ? 'Comanda Copiada!' : 'Copiar Comanda em Texto'}</span>
                </button>
              </div>

              {/* Comanda preview */}
              <div className="max-w-md mx-auto mt-4 p-4 rounded-xl bg-[#0b0c12] border border-gray-800 text-left text-xs font-mono text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {completedOrderMessage}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setCompletedOrderUrl(null);
                    setIsCheckoutOpen(false);
                  }}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Fechar janela e voltar ao cardápio
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: Customer Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Seus Dados de Contato</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-300 block mb-1">
                      Nome Completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 block mb-1">
                      Telefone / WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="(85) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Delivery vs Pickup */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" />
                  <span>2. Modalidade de Recebimento</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      deliveryType === 'delivery'
                        ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-[#161824] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bike className="w-5 h-5 text-amber-400" />
                      <span className="text-xs sm:text-sm font-bold text-white">Entrega (Delivery)</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Taxa Fixa: <strong className="text-amber-400">{formatCurrency(settings.deliveryFee)}</strong>
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      deliveryType === 'pickup'
                        ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-[#161824] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-amber-400" />
                      <span className="text-xs sm:text-sm font-bold text-white">Retirada no Balcão</span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">
                      Taxa de Entrega: R$ 0,00 (Grátis)
                    </p>
                  </button>
                </div>
              </div>

              {/* SECTION 3: Address (Only if Delivery) */}
              {deliveryType === 'delivery' ? (
                <div className="space-y-3 bg-[#141624] p-4 rounded-2xl border border-gray-800/80">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>3. Endereço de Entrega</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        CEP (Opcional - Busca Automática)
                      </label>
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => handleCepLookup(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191b2b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                      />
                      {isLoadingCep && <span className="text-[10px] text-amber-400">Buscando endereço...</span>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Rua / Avenida <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nome da sua rua"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191b2b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Número <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nº ou S/N"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191b2b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Bairro <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Seu bairro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191b2b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        placeholder="Apto, Bloco, Casa..."
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191b2b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Próximo à padaria Real, em frente à praça..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 bg-[#191b2b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#141624] border border-gray-800 text-xs text-gray-300 flex items-start gap-3">
                  <Store className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Endereço de Retirada da King Pizzaria:</strong>
                    <span>{settings.address}</span>
                    <p className="text-amber-400/90 text-[11px] mt-1">
                      Tempo estimado de preparo para retirada: {settings.estimatedPickupTime}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 4: Forma de Pagamento */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>4. Forma de Pagamento</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'pix', label: 'PIX', icon: QrCoreIcon },
                    { id: 'cash', label: 'Dinheiro', icon: DollarSign },
                    { id: 'credit', label: 'Cartão Crédito', icon: CreditCard },
                    { id: 'debit', label: 'Cartão Débito', icon: CreditCard },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 text-white font-bold'
                            : 'bg-[#161824] border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-gray-500'}`} />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Method Specific details */}
                {paymentMethod === 'pix' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">Chave PIX da King Pizzaria ({settings.pixKeyType}):</span>
                      <button
                        type="button"
                        onClick={handleCopyPixKey}
                        className="px-2.5 py-1 bg-amber-500 text-black font-extrabold text-[10px] rounded-lg hover:bg-amber-400 flex items-center gap-1 transition-colors"
                      >
                        {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPix ? 'Copiada!' : 'Copiar Chave'}</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded bg-[#0b0c12] font-mono text-amber-400 text-xs select-all">
                      {settings.pixKey}
                    </div>

                    <p className="text-[11px] text-gray-300">
                      Favorecido: <strong>{settings.pixBeneficiary}</strong>.
                      <br />
                      Após enviar o pedido no WhatsApp, encaminhe o comprovante de pagamento para liberação imediata no forno!
                    </p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-4 rounded-xl bg-[#141624] border border-gray-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="troco-checkbox"
                        checked={needChange}
                        onChange={(e) => setNeedChange(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-gray-800 border-gray-700"
                      />
                      <label htmlFor="troco-checkbox" className="text-white font-medium cursor-pointer">
                        Precisa de troco?
                      </label>
                    </div>

                    {needChange && (
                      <div className="pt-1">
                        <label className="text-[11px] text-gray-400 block mb-1">
                          Troco para quanto? (Ex: R$ 100,00)
                        </label>
                        <input
                          type="text"
                          placeholder="Informe o valor em dinheiro"
                          value={changeForValue}
                          onChange={(e) => setChangeForValue(e.target.value)}
                          className="w-full sm:w-60 px-3 py-2 bg-[#1a1c2a] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                  <div className="p-3.5 rounded-xl bg-[#141624] border border-gray-800 text-xs text-gray-300 flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      O pagamento com <strong>{paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'}</strong> será realizado na entrega ou na retirada com a maquininha.
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 5: Financial Summary */}
              <div className="bg-[#141624] p-4 rounded-2xl border border-gray-800 space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({cart.length} itens)</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Taxa de Entrega {deliveryType === 'pickup' && '(Retirada no Balcão)'}</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                    {deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">VALOR TOTAL DO PEDIDO</span>
                  <span className="text-2xl font-black text-amber-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer with Big Action Button */}
        {!completedOrderUrl && (
          <div className="p-4 sm:p-5 bg-[#141622] border-t border-amber-500/20">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalizeWhatsAppOrder}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-60 text-white font-black text-base rounded-2xl shadow-xl shadow-red-600/35 border border-red-500/50 flex items-center justify-center gap-2.5 active:scale-98 transition-all"
            >
              <Crown className="w-5 h-5 text-amber-300" />
              <span>{isSubmitting ? 'ENVIANDO PEDIDO...' : 'FINALIZAR PEDIDO PELO WHATSAPP'}</span>
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              Você será direcionado para o WhatsApp oficial da King Pizzaria (55 85 98528-0354) com a comanda formatada.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

// Mini QR Code Icon helper
function QrCoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}
