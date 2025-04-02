import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { TimeSlot, Appointment } from '../types';
import { calculateEndTime } from '../utils/dateUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  slot: TimeSlot | null;
  appointment: Appointment | null;
  errorMessage: string | null;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  slot,
  appointment,
  errorMessage
}) => {
  const [formData, setFormData] = useState<Omit<Appointment, 'id'> & { id?: string }>({
    date: new Date(),
    startTime: '',
    endTime: '',
    student: '',
    subject: '',
    duration: '1 час',
    comment: '',
    homework: '',
    studied: '',
    isConfirmed: false,
    isCompleted: false,
    isPaid: false
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (appointment) {
      setFormData(appointment);
    } else if (slot) {
      const endTime = calculateEndTime(slot.time, '1 час');
      setFormData({
        date: slot.date,
        startTime: slot.time,
        endTime,
        student: '',
        subject: '',
        duration: '1 час',
        comment: '',
        homework: '',
        studied: '',
        isConfirmed: false,
        isCompleted: false,
        isPaid: false
      });
    }
  }, [appointment, slot]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      // If trying to uncheck "completed", show confirmation
      if (name === 'isCompleted' && !checked && formData.isCompleted) {
        setShowConfirmation(true);
        return;
      }

      // If unchecking "completed", also uncheck "paid"
      if (name === 'isCompleted' && !checked) {
        setFormData(prev => ({ ...prev, isCompleted: false, isPaid: false }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle duration change and recalculate end time
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = e.target.value;
    const newEndTime = calculateEndTime(formData.startTime, newDuration);
    
    setFormData(prev => ({
      ...prev,
      duration: newDuration,
      endTime: newEndTime
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const appointmentData: Appointment = {
      id: formData.id || crypto.randomUUID(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      student: formData.student,
      subject: formData.subject,
      duration: formData.duration,
      comment: formData.comment,
      homework: formData.homework,
      studied: formData.studied,
      isConfirmed: formData.isConfirmed,
      isCompleted: formData.isCompleted,
      isPaid: formData.isPaid
    };
    
    onSave(appointmentData);
  };

  // Handle delete button click
  const handleDelete = () => {
    if (formData.id) {
      onDelete(formData.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {appointment ? 'Редактировать запись' : 'Новая запись'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ученик
              </label>
              <select
                name="student"
                value={formData.student}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Выберите ученика</option>
                <option value="Ученик-1">Ученик-1</option>
                <option value="Ученик-2">Ученик-2</option>
                <option value="Ученик-3">Ученик-3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Предмет
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Выберите предмет</option>
                <option value="Математика база">Математика база</option>
                <option value="Математика профиль">Математика профиль</option>
                <option value="Физика ОГЭ">Физика ОГЭ</option>
                <option value="Физика ЕГЭ">Физика ЕГЭ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время начала
              </label>
              <input
                type="text"
                name="startTime"
                value={formData.startTime}
                readOnly
                className="w-full p-2 border rounded-md bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Длительность
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleDurationChange}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="1 час">1 час</option>
                <option value="1 час 30 минут">1 час 30 минут</option>
                <option value="2 часа">2 часа</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Домашнее задание
            </label>
            <textarea
              name="homework"
              value={formData.homework}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Изучено на занятии
            </label>
            <textarea
              name="studied"
              value={formData.studied}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isConfirmed"
                name="isConfirmed"
                checked={formData.isConfirmed}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isConfirmed" className="ml-2 block text-sm text-gray-700">
                Занятие подтверждено
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCompleted"
                name="isCompleted"
                checked={formData.isCompleted}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-700">
                Занятие проведено
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPaid"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                disabled={!formData.isCompleted}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700">
                Занятие оплачено
              </label>
            </div>
          </div>
          
          <div className="flex justify-between">
            {appointment && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить запись
              </button>
            )}
            
            <div className="ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-100"
              >
                Отмена
              </button>
              
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                <Save className="h-4 w-4 mr-1" />
                Сохранить
              </button>
            </div>
          </div>
        </form>

        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-start mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-medium">Подтверждение</h3>
              </div>
              <p className="mb-6">Вы уверены, что хотите снять отметку о проведении занятия?</p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={() => setShowConfirmation(false)}
                >
                  Отмена
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, isCompleted: false, isPaid: false }));
                    setShowConfirmation(false);
                  }}
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;