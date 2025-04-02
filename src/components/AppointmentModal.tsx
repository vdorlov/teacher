import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { TimeSlot, Appointment, Student } from '../types';
import { calculateEndTime } from '../utils/dateUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  slot: TimeSlot | null;
  appointment: Appointment | null;
  errorMessage: string | null;
  students: Student[];
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  slot,
  appointment,
  errorMessage,
  students
}) => {
  const [formData, setFormData] = useState<Omit<Appointment, 'id'> & { id?: string }>({
    date: new Date(),
    startTime: '',
    endTime: '',
    student: '',
    subject: '',
    duration: '1 час',
    price: 0,
    comment: '',
    homework: '',
    studied: '',
    isConfirmed: false,
    isCompleted: false,
    isPaid: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Фильтруем список учеников на основе поискового запроса
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработчик выбора ученика
  const handleStudentSelect = (studentName: string) => {
    setFormData(prev => ({ ...prev, student: studentName }));
    setSearchTerm(studentName);
    setIsStudentListOpen(false);
  };

  // Initialize form data when modal opens
  useEffect(() => {
    if (appointment) {
      setFormData(appointment);
      setSearchTerm(appointment.student);
    } else if (slot) {
      const endTime = calculateEndTime(slot.time, '1 час');
      setFormData({
        date: slot.date,
        startTime: slot.time,
        endTime,
        student: '',
        subject: '',
        duration: '1 час',
        price: 0,
        comment: '',
        homework: '',
        studied: '',
        isConfirmed: false,
        isCompleted: false,
        isPaid: false
      });
      setSearchTerm('');
    }
  }, [appointment, slot]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;

      if (name === 'isCompleted' && !checked && formData.isCompleted) {
        setShowConfirmation(true);
        return;
      }

      if (name === 'isCompleted' && !checked) {
        setFormData(prev => ({ ...prev, isCompleted: false, isPaid: false }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'price') {
      const numericValue = value === '' ? 0 : parseFloat(value);
      // Форматируем значение с разделителями тысяч
      const formattedValue = numericValue.toLocaleString('ru-RU');
      e.target.value = formattedValue;
      setFormData(prev => ({ ...prev, [name]: numericValue }));
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
    console.log('Form data before submit:', formData);

    const appointmentData: Appointment = {
      id: formData.id || crypto.randomUUID(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      student: formData.student,
      subject: formData.subject,
      duration: formData.duration,
      price: formData.price,
      comment: formData.comment,
      homework: formData.homework,
      studied: formData.studied,
      isConfirmed: formData.isConfirmed,
      isCompleted: formData.isCompleted,
      isPaid: formData.isPaid
    };
    console.log('Appointment data to save:', appointmentData);
    onSave(appointmentData);
  };

  // Handle delete button click
  const handleDelete = () => {
    if (formData.id) {
      onDelete(formData.id);
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsStudentListOpen(false);
    } else if (e.key === 'Enter' && filteredStudents.length > 0) {
      e.preventDefault();
      handleStudentSelect(filteredStudents[0].name);
    } else if (e.key === 'ArrowDown' && isStudentListOpen && filteredStudents.length > 0) {
      e.preventDefault();
      const firstStudent = document.querySelector('.student-option') as HTMLElement;
      if (firstStudent) firstStudent.focus();
    }
  };

  // Обработчик клика вне списка
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.student-search-container')) {
        setIsStudentListOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <div className="relative student-search-container">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ученик
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsStudentListOpen(true);
                  // Обновляем значение в formData только если есть точное совпадение
                  const exactMatch = students.find(s => s.name.toLowerCase() === e.target.value.toLowerCase());
                  if (exactMatch) {
                    setFormData(prev => ({ ...prev, student: exactMatch.name }));
                  } else {
                    setFormData(prev => ({ ...prev, student: '' }));
                  }
                }}
                onFocus={() => setIsStudentListOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Начните вводить имя ученика..."
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              {isStudentListOpen && filteredStudents.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer student-option focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleStudentSelect(student.name)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleStudentSelect(student.name);
                        }
                      }}
                    >
                      {student.name}
                    </div>
                  ))}
                </div>
              )}
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
                <option value="Математика ОГЭ">Математика ОГЭ</option>
                <option value="Математика ЕГЭ (профиль)">Математика ЕГЭ (профиль)</option>
                <option value="Математика ЕГЭ (база)">Математика ЕГЭ (база)</option>
                <option value="Математика 8 класс">Математика 8 класс</option>
                <option value="Физика ОГЭ">Физика ОГЭ</option>
                <option value="Физика ЕГЭ">Физика ЕГЭ</option>
                <option value="Русский язык ЕГЭ">Русский язык ЕГЭ</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Стоимость занятия
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="price"
                  value={formData.price === 0 ? '' : formData.price.toLocaleString('ru-RU')}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 pr-12"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  ₽
                </div>
              </div>
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
              Пройдено
            </label>
            <textarea
              name="studied"
              value={formData.studied}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isConfirmed"
                checked={formData.isConfirmed}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Подтверждено
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isCompleted"
                checked={formData.isCompleted}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Проведено
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                disabled={!formData.isCompleted}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label className="ml-2 text-sm text-gray-700">
                Оплачено
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center border-t pt-4 mt-4">
            {appointment && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Отмена
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
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