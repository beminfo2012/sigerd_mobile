import React from 'react'
import { User, Settings, LogOut, Database, WifiOff } from 'lucide-react'

const Menu = () => {
    return (
        <div className="p-4">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6 flex items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 mr-4">
                    ADM
                </div>
                <div>
                    <h2 className="mb-0 text-lg">Administrador</h2>
                    <p className="text-gray-500 text-sm">Defesa Civil</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center hover:bg-gray-50 cursor-pointer">
                    <User className="mr-3 text-gray-500" />
                    <span>Editar Perfil</span>
                </div>
                <div className="p-4 border-b flex items-center hover:bg-gray-50 cursor-pointer">
                    <Database className="mr-3 text-gray-500" />
                    <span>Sincronizar Dados Offline</span>
                </div>
                <div className="p-4 border-b flex items-center hover:bg-gray-50 cursor-pointer">
                    <Settings className="mr-3 text-gray-500" />
                    <span>Configurações</span>
                </div>
                <div className="p-4 flex items-center hover:bg-gray-50 cursor-pointer text-red-600">
                    <LogOut className="mr-3" />
                    <span>Sair</span>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-400 text-xs">
                <p>Versão 1.0.0 (Beta)</p>
                <p>Defesa Civil Municipal</p>
            </div>
        </div>
    )
}

export default Menu
