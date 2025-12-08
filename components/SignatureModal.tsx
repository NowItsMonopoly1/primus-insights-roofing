
import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, PenTool, CheckCircle2 } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
  contractDetails: {
    customerName: string;
    systemSize: number;
    monthlyPayment: number;
    totalCost: number;
  };
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  contractDetails 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(clearCanvas, 100);
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        setHasSignature(false);
      }
    }
  };

  const handleSave = () => {
    if (!canvasRef.current || !hasSignature) return;
    const dataUrl = canvasRef.current.toDataURL();
    onConfirm(dataUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
           <div>
             <h3 className="text-xl font-display font-bold text-slate-900">Installation Agreement</h3>
             <p className="text-sm text-slate-500">Primus Home Pro • License #9942104</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <X size={24} />
           </button>
        </div>

        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4 overflow-y-auto">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Deal Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                    <div>Customer: <span className="font-bold">{contractDetails.customerName}</span></div>
                    <div>System Size: <span className="font-bold">{contractDetails.systemSize} kW</span></div>
                    <div>Total Cost: <span className="font-bold">${contractDetails.totalCost.toLocaleString()}</span></div>
                    <div>Monthly Pmt: <span className="font-bold">${contractDetails.monthlyPayment}</span></div>
                </div>
            </div>
            
            <div className="text-[10px] text-slate-500 leading-relaxed text-justify">
                <p><strong>1. AGREEMENT TO INSTALL.</strong> By signing below, Customer agrees to purchase the Solar System described above. Primus Home Pro agrees to install the system in a workmanlike manner.</p>
                <p className="mt-2"><strong>2. FINANCIAL TERMS.</strong> Customer acknowledges that the Federal Tax Credit (ITC) is a tax incentive and not a guaranteed rebate. Monthly payments are estimated based on 20-year loan terms at 4.99% APR.</p>
                <p className="mt-2"><strong>3. BINDING EFFECT.</strong> This electronic signature is legally binding and equivalent to a physical signature.</p>
            </div>
        </div>

        <div className="p-6 bg-white flex-1 flex flex-col items-center justify-center">
             <div className="w-full relative">
                 <div className="absolute top-0 left-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-br">
                    SIGN HERE
                 </div>
                 <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="border-2 border-dashed border-slate-300 rounded-lg w-full bg-white cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                 />
                 <div className="absolute bottom-4 left-4 text-slate-400 text-xs pointer-events-none select-none">
                    x ___________________________________________
                 </div>
             </div>
             
             <div className="flex justify-between w-full mt-4">
                 <button 
                   onClick={clearCanvas} 
                   className="flex items-center gap-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors"
                 >
                    <Eraser size={16} /> Clear Signature
                 </button>
             </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
             <button 
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-white transition-colors"
             >
                Cancel
             </button>
             <button 
                onClick={handleSave}
                disabled={!hasSignature}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
             >
                <PenTool size={18} />
                Confirm & Sign Deal
             </button>
        </div>
      </div>
    </div>
  );
};
